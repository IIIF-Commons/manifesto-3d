var expect = require('chai').expect;
var should = require('chai').should();
var fs = require('fs');
var path = require('path');
var manifesto = require('../../../dist-commonjs/');

let manifest, sequence, scene, nonContentAnnotations, comments, activatingAnnotations;

describe('astronaut_comment_activating_motivation', function() {

    it('loads successfully', function() {
        const raw = fs.readFileSync(
            path.join(__dirname, 'astronaut_comment_activating_motivation.json'),
            'utf8'
        );
        manifest = manifesto.parseManifest(JSON.parse(raw));
        expect(manifest).to.exist;
    });

    it('has a sequence', function() {
        sequence = manifest.getSequenceByIndex(0);
        expect(sequence).to.exist;
    });

    it('has a scene', function() {
        scene = sequence.getScenes()[0];
        expect(scene).to.exist;
        expect(scene.isScene());
    });

    it('has three painting annotations (model + two hidden cameras)', function() {
        const annotations = scene.getContent();
        expect(annotations.length).to.equal(3);
    });

    // Regression check: this fixture puts its non-painting annotations on the
    // Manifest's own top-level "annotations" property, not the Scene's - so
    // Scene.getNonContentAnnotations() alone must not see them.
    it('has no non-content annotations directly on the Scene', function() {
        expect(scene.getNonContentAnnotations().length).to.equal(0);
    });

    it('has four non-content annotations on the Manifest', function() {
        nonContentAnnotations = manifest.getNonContentAnnotations();
        expect(nonContentAnnotations.length).to.equal(4);
    });

    it('has two commenting annotations', function() {
        comments = nonContentAnnotations.filter(
            (a) => [].concat(a.getMotivation())[0] === 'commenting'
        );
        expect(comments.length).to.equal(2);
    });

    it('commenting annotations target the Scene with a PointSelector', function() {
        const comment = comments[0];

        const target = comment.getTarget();
        expect(target.isSpecificResource);
        expect(target.getSource()).to.exist;

        const selector = target.getSelector();
        expect(selector.isPointSelector);

        const location = selector.getLocation();
        expect(location.x).to.exist;
        expect(location.y).to.exist;
        expect(location.z).to.exist;
    });

    it('has two activating annotations', function() {
        activatingAnnotations = nonContentAnnotations.filter(
            (a) => [].concat(a.getMotivation())[0] === 'activating'
        );
        expect(activatingAnnotations.length).to.equal(2);
    });

    it('activating annotation targets its commenting annotation by reference', function() {
        const activating = activatingAnnotations[0];

        const target = activating.getTarget();
        expect(target.type).to.equal('Annotation');
        target.id.should.equal(comments[0].id);
    });

    it('activating annotation body sources its camera annotation and lists actions', function() {
        const activating = activatingAnnotations[0];

        const body = activating.getBody()[0];
        expect(body.isSpecificResource()).to.equal(true);

        const source = body.getSource();
        expect(source instanceof manifesto.AnnotationBody).to.equal(true);
        expect(source.getProperty('type')).to.equal('Annotation');
        source.id.should.equal('https://example.org/iiif/3d/cameras/1');

        const action = body.getProperty('action');
        expect(action).to.deep.equal(['show', 'enable', 'select']);
    });

    it('resolves to a hidden PerspectiveCamera painting annotation with a lookAt', function() {
        const activating = activatingAnnotations[0];
        const cameraRef = activating.getBody()[0].getSource();

        const cameraAnnotation = scene
            .getContent()
            .find((a) => a.id === cameraRef.id);
        expect(cameraAnnotation).to.exist;

        expect([].concat(cameraAnnotation.getProperty('behavior') ?? [])).to.include('hidden');

        const cameraBody = cameraAnnotation.getBody()[0];
        expect(cameraBody instanceof manifesto.Camera).to.equal(true);
        expect(cameraBody.isPerspectiveCamera()).to.equal(true);

        const lookAtLocation = cameraBody.getLookAt()?.getLocation();
        expect(lookAtLocation.x).to.eq(0);
        expect(lookAtLocation.y).to.eq(2.0108470916748047);
        expect(lookAtLocation.z).to.eq(-0.012333005666732798);
    });
});
