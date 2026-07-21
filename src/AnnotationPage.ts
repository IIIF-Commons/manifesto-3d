import { Annotation, IManifestoOptions, ManifestResource } from "./internal";
// @ts-ignore
import flattenDeep from "lodash/flattenDeep";

export class AnnotationPage extends ManifestResource {
  constructor(jsonld: any, options: IManifestoOptions) {
    super(jsonld, options);
  }

  getItems(): Annotation[] {
    return this.getProperty("items");
  }

  /**
   * Shared by Manifest/Scene/Canvas's getNonContentAnnotations(): given the raw
   * value of a resource's own "annotations" property, resolve it to a flat list
   * of Annotation instances.
   */
  static parseNonContentAnnotations(
    rawAnnotationPages: any,
    options: IManifestoOptions
  ): Annotation[] {
    const annotationPages = (rawAnnotationPages || [])
      .filter(
        (annotationPage) =>
          annotationPage && annotationPage.type === "AnnotationPage"
      )
      .map((annotationPage) => new AnnotationPage(annotationPage, options));
    if (!annotationPages.length) return [];

    const annotationsNested = annotationPages.map((page) =>
      page.getItems()
    ) as Annotation[][];
    const annotationsFlat = flattenDeep(annotationsNested) as Annotation[];

    return annotationsFlat.map(
      (annotation) => new Annotation(annotation, options)
    );
  }
}
