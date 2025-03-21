var expect = require('chai').expect;
var should = require('chai').should();
var manifesto = require('../../../dist-commonjs');
//var manifests_3d = require('../fixtures/manifests_3d');


var ExternalResourceType = require('@iiif/vocabulary/dist-commonjs/').ExternalResourceType;
var MediaType = require('@iiif/vocabulary/dist-commonjs/').MediaType;


let manifest,   scene , annotations, body;

let manifest_url = {
        local: "",
        remote : "https://raw.githubusercontent.com/IIIF/3d/whale_anno/manifests/9_commenting_annotations/whale_comment_camera.json"
    }.remote;

describe('c_comment_annotation_camera', function() {

    it('loads successfully', function(done) {
        manifesto.loadManifest(manifest_url).then(function(data) {
            manifest = manifesto.parseManifest(data);
            done();
        });
    });

   

    it('has a scene', function() {
        sequence = manifest.getSequenceByIndex(0);
        scene = sequence.getScenes()[0];
        expect(scene).to.exist;
        expect(scene.isScene()).to.be.ok;
    });
    
    
    it('with 4 annotation', function(){
        var annotations = scene.getContent();
        expect(annotations.length).to.equal(4);
    });
        
    it('annotation 3 is TextualBody', function(){
        var annotations = scene.getContent();
        expect(annotations.length).to.equal(4);
        var textBody = annotations[2].getBody()[0];
        expect(textBody instanceof manifesto.TextualBody).to.equal(true);
        expect(textBody.Value).to.exist;
    });
    
    it('annotation 4 is a camera', function(){
        var annotations = scene.getContent();
        expect(annotations.length).to.equal(4);
        var camera = annotations[3].getBody()[0];
        expect(camera).to.exist;
                      
        expect(camera instanceof manifesto.Camera).to.equal(true);
        expect(camera.isPerspectiveCamera()).to.equal(true);        
    });
    
    it('camera has null LookAt property', function(){
        var annotations = scene.getContent();
        var camera = annotations[3].getBody()[0];

        expect(camera.LookAt).to.equal(null);       
    });
    
    it('all annotation have a body', function(){
        var annotations = scene.getContent();
        for (var i = 0; i < annotations.length; ++i){
            var custom_message = "annotation " + i + " body fails exist";
            var body = annotations[i].getBody()[0];
            expect(body, custom_message).to.exist;
        }
    });   
});
