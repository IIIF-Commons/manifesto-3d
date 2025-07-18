import {
  Duration,
  IManifestoOptions,
  ManifestResource,
  TreeNode,
  TreeNodeType,
  Utils,
} from "./internal";
import {
  Behavior,
  ViewingDirection,
  ViewingHint,
} from "@iiif/vocabulary/dist-commonjs";

export class Range extends ManifestResource {
  private _ranges: Range[] | null = null;
  public canvases: string[] | null = null;
  public items: ManifestResource[] = [];
  public parentRange: Range | undefined;
  public path: string;
  public treeNode: TreeNode;

  constructor(jsonld?: any, options?: IManifestoOptions) {
    super(jsonld, options);
  }

  getCanvasIds(): string[] {
    if (this.__jsonld.canvases) {
      return this.__jsonld.canvases;
    } else if (this.canvases) {
      return this.canvases;
    }

    return [];
  }

  getDuration(): Duration | undefined {
    // For this implementation, we want to catch SOME of the temporal cases - i.e. when there is a t=1,100
    if (this.canvases && this.canvases.length) {
      const startTimes: number[] = [];
      const endTimes: number[] = [];

      // When we loop through all of the canvases we store the recorded start and end times.
      // Then we choose the maximum and minimum values from this. This will give us a more accurate duration for the
      // Chosen range. However this is still not perfect and does not cover more complex ranges. These cases are out of
      // scope for this change.
      for (const canvas of this.canvases) {
        if (!canvas) continue;
        const [, canvasId, start, end] = (canvas.match(
          /(.*)#t=([0-9.]+),?([0-9.]+)?/
        ) || [undefined, canvas]) as string[];

        if (canvasId) {
          startTimes.push(parseFloat(start));
          endTimes.push(parseFloat(end));
        }
      }

      if (startTimes.length && endTimes.length) {
        return new Duration(Math.min(...startTimes), Math.max(...endTimes));
      }
    } else {
      // get child ranges and calculate the start and end based on them
      const childRanges = this.getRanges();
      const startTimes: number[] = [];
      const endTimes: number[] = [];

      // Once again, we use a max/min to get the ranges.
      for (const childRange of childRanges) {
        const duration = childRange.getDuration();
        if (duration) {
          startTimes.push(duration.start);
          endTimes.push(duration.end);
        }
      }

      // And return the minimum as the start, and the maximum as the end.
      if (startTimes.length && endTimes.length) {
        return new Duration(Math.min(...startTimes), Math.max(...endTimes));
      }
    }

    let start: number | undefined;
    let end: number | undefined;

    // There are 2 paths for this implementation. Either we have a list of canvases, or a list of ranges
    // which may have a list of ranges.
    // This is one of the limitations of this implementation.
    if (this.canvases && this.canvases.length) {
      // When we loop through each of the canvases we are expecting to see a fragment or a link to the whole canvas.
      // For example - if we have http://example.org/canvas#t=1,100 it will extract 1 and 100 as the start and end.
      for (let i = 0; i < this.canvases.length; i++) {
        const canvas: string = this.canvases[i];
        const temporal: number[] | null = Utils.getTemporalComponent(canvas);
        if (temporal && temporal.length > 1) {
          if (i === 0) {
            // Note: Cannot guarantee ranges are sequential (fixed above)
            start = Number(temporal[0]);
          }

          if (i === this.canvases.length - 1) {
            end = Number(temporal[1]); // Note: The end of this duration may be targeting a different canvas.
          }
        }
      }
    } else {
      // In this second case, where there are nested ranges, we recursively get the duration
      // from each of the child ranges (a start and end) and then choose the first and last for the bounds of this range.
      const childRanges: Range[] = this.getRanges();

      for (let i = 0; i < childRanges.length; i++) {
        const childRange: Range = childRanges[i];

        const duration: Duration | undefined = childRange.getDuration();

        if (duration) {
          if (i === 0) {
            start = duration.start;
          }

          if (i === childRanges.length - 1) {
            end = duration.end;
          }
        }
      }
    }

    if (start !== undefined && end !== undefined) {
      return new Duration(start, end);
    }

    return undefined;
  }

  // getCanvases(): ICanvas[] {
  //     if (this._canvases) {
  //         return this._canvases;
  //     }

  //     return this._canvases = <ICanvas[]>this.items.en().where(m => m.isCanvas()).toArray();
  // }

  getRanges(): Range[] {
    if (this._ranges) {
      return this._ranges;
    }

    return (this._ranges = <Range[]>this.items.filter((m) => m.isRange()));
  }

  getBehavior(): Behavior | null {
    let behavior: any = this.getProperty("behavior");

    if (Array.isArray(behavior)) {
      behavior = behavior[0];
    }

    if (behavior) {
      return behavior;
    }

    return null;
  }

  getViewingDirection(): ViewingDirection | null {
    return this.getProperty("viewingDirection");
  }

  getViewingHint(): ViewingHint | null {
    return this.getProperty("viewingHint");
  }

  getTree(treeRoot: TreeNode): TreeNode {
    treeRoot.data = this;
    this.treeNode = treeRoot;

    const ranges: Range[] = this.getRanges();

    if (ranges && ranges.length) {
      for (let i = 0; i < ranges.length; i++) {
        const range: Range = ranges[i];
        const node: TreeNode = new TreeNode();
        treeRoot.addNode(node);
        this._parseTreeNode(node, range);
      }
    }

    Utils.generateTreeNodeIds(treeRoot);

    return treeRoot;
  }

  public spansTime(time: number): boolean {
    const duration: Duration | undefined = this.getDuration();

    if (duration) {
      if (time >= duration.start && time <= duration.end) {
        return true;
      }
    }

    return false;
  }

  private _parseTreeNode(node: TreeNode, range: Range): void {
    node.label = <string>range.getLabel().getValue(this.options.locale);
    node.data = range;
    node.data.type = Utils.normaliseType(TreeNodeType.RANGE);
    range.treeNode = node;

    const ranges: Range[] = range.getRanges();

    if (ranges && ranges.length) {
      for (let i = 0; i < ranges.length; i++) {
        const childRange = ranges[i];
        const behavior: Behavior | null = childRange.getBehavior();

        if (behavior === Behavior.NO_NAV) {
          continue;
        } else {
          const childNode: TreeNode = new TreeNode();
          node.addNode(childNode);
          this._parseTreeNode(childNode, childRange);
        }
      }
    }
  }
}
