import { test, moduleForComponent } from "ember-qunit";
import { testingKick } from "liquid-fire/mutation-observer";
import LiquidSpacer from "liquid-fire/components/liquid-spacer";
import sinon from 'sinon';
import hbs from 'htmlbars-inline-precompile';

let tmap;

moduleForComponent('Integration: liquid-spacer', {
  integration: true,
  beforeEach() {
    tmap = this.container.lookup('service:liquid-fire-transitions');
  },
  afterEach() {
    tmap = null;
  }
});

test('it should animate', function(assert) {
  let theSpacer;
  this.registry.register('component:x-spacer', LiquidSpacer.extend({
    didInsertElement() {
      this._super();
      theSpacer = this;
    }
  }));
  this.set('message', longMessage);
  this.render(hbs`
               <div style="width: 20em">
               {{#x-spacer id="my-spacer" growDuration=1 }}
                 {{message}}
               {{/x-spacer}}
               </div>
              `);

  sinon.spy(theSpacer, 'animateGrowth');
  this.set('message', shortMessage);
  testingKick();
  return tmap.waitUntilIdle().then(() => {
    let [, have, want] = theSpacer.animateGrowth.lastCall.args;
    assert.ok(want.height < have.height, `expected ${want.height} < ${have.height}`);
  });
});

['content-box', 'border-box'].forEach(function(boxSizing) {
  test(`it should maintain size stability (${boxSizing})`, function(assert) {
    this.set('message', longMessage);
    this.set('boxSizing', boxSizing);
    this.render(hbs`
               <button {{action "toggle"}}>Toggle</button>
               <style>
                #my-spacer {
                  padding: 2px;
                  margin: 4px;
                  border: 1px solid black;
                  box-sizing: {{boxSizing}};
               }
               </style>
               <div style="width: 20em">
               {{#liquid-spacer id="my-spacer" growDuration=1 }}
                 {{message}}
               {{/liquid-spacer}}
               </div>
               `);


    this.on('toggle', () => {
      if (this.get('message') === longMessage) {
        this.set('message', shortMessage);
      } else {
        this.set('message', longMessage);
      }
    });

    let initialWidth = this.$('#my-spacer').outerWidth();
    let initialHeight = this.$('#my-spacer').outerHeight();
    this.set('message', shortMessage);
    testingKick();
    return tmap.waitUntilIdle().then(() => {
      this.set('message', longMessage);
      testingKick();
      return tmap.waitUntilIdle();
    }).then(() => {
      assert.equal(this.$('#my-spacer').outerWidth(), initialWidth, 'width');
      assert.equal(this.$('#my-spacer').outerHeight(), initialHeight, 'height');
    });
  });
});

test('it should not set width style if growWidth is false', function(assert) {
  assert.expect(2);

  this.render(hbs`
               {{#liquid-spacer id="my-spacer" growWidth=false}}
                 Hi.
               {{/liquid-spacer}}
              `);

  let style = this.$('#my-spacer').get(0).style;

  assert.equal(style.width, '', 'width style is unset');
  assert.ok(/^\d+px$/.test(style.height), 'height style is set to ' + style.height);
});

test('it should not set height style if growHeight is false', function(assert) {
  assert.expect(2);

  this.render(hbs`
               {{#liquid-spacer id="my-spacer" growHeight=false}}
                 Hi.
               {{/liquid-spacer}}
              `);

  let style = this.$('#my-spacer').get(0).style;

  assert.equal(style.height, '', 'height style is unset');
  assert.ok(/^\d+px$/.test(style.width), 'width style is set to ' + style.width);
});

test('it should set correct height when scaled', function(assert) {
  assert.expect(1);

  this.render(hbs`
               <div style="transform: scale(0.5);">
                 {{#liquid-spacer id="my-spacer"}}
                   <div style="width:50px; height:50px; background-color:blue;"></div>
                 {{/liquid-spacer}}
               </div>
              `);

  let style = this.$('#my-spacer').get(0).style;

  let expectedHeight = 50;
  let height = parseFloat(style.height, 10);
  let tolerance = 0.1;
  assert.ok(Math.abs(height - expectedHeight) < tolerance, `height (${height}) is within ${tolerance} pixels of ${expectedHeight}`);
});


const shortMessage = "Hi.";
const longMessage = "This is a long message. This is a long message. This is a long message. This is a long message. This is a long message. This is a long message. This is a long message. This is a long message. ";
