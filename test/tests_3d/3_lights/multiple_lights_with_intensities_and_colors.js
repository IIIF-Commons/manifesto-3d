var expect = require('chai').expect;
var should = require('chai').should();
var manifesto = require('../../../dist-commonjs/');


var ExternalResourceType = require('@iiif/vocabulary/dist-commonjs/').ExternalResourceType;
var MediaType = require('@iiif/vocabulary/dist-commonjs/').MediaType;


let manifest,  sequence, scene , model, body, annotations;

let manifest_url = {
        local: "http://localhost:3001/model_origin.json",
        remote : "https://raw.githubusercontent.com/IIIF/3d/main/manifests/3_lights/multiple_lights_with_intensities_and_colors.json"
    }.remote;

describe('test SpecificResource without transform property', function() {

    it('loads successfully', function(done) {
        manifesto.loadManifest(manifest_url).then(function(data) {
            manifest = manifesto.parseManifest(data);
            done();
        });
    });

    
    it('has a scene with 4 annotation', function(){
        sequence = manifest.getSequenceByIndex(0);
        expect(sequence).to.exist;
        scene = sequence.getScenes()[0];
        expect(scene).to.exist;
        expect(scene.isScene()).to.be.ok;
        annotations = scene.getContent();
        expect(annotations.length).to.equal(4);
    });    
    
    it('annotation[3] has body SpecificResource with no transform', function(){
        let body = annotations[3].getBody()[0];
        expect(body).to.exist;
        expect(body.isSpecificResource()).to.equal(true);
        
        let transform = body.getTransform();
        expect(transform).to.equal(null);
    });      

        
});
