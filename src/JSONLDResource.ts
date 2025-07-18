export class JSONLDResource {
  context: string;
  id: string;
  __jsonld: any;

  constructor(jsonld?: any) {
    this.__jsonld = jsonld;
    this.context = this.getProperty("context");
    this.id = this.getProperty("id");
  }

  getProperty(name: string): any {
    let prop: any = null;

    if (this.__jsonld) {
      prop = this.__jsonld[name];

      if (!prop) {
        // property may have a prepended '@'
        prop = this.__jsonld["@" + name];
      }
    }

    return prop;
  }

  /**
  A function that wraps the getProperty function, which client
  code can use if it is needed to identify when the json value of
  a property is an IRI -- Internationalized Resource Identifier
  
  If the value of the json value is a bare string, then it will be
  wrapped in a json object with the string in the property 'id', 
  additionally that property will have a property 'isIRI' which will
  be true for the literal string case, otherwise false meaning the
  returned getProperty should be parsed as before.
  
  **/
  getPropertyAsObject(name: string): any {
    let prop = this.getProperty(name);

    if (typeof prop === "string") return { id: prop, isIRI: true };
    else if (prop === Object(prop)) return prop;
    else {
      return null;
    }
  }
}
