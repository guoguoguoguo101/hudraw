import assert from 'node:assert/strict';
import {renderQuality,combatFrameRate} from '../src/rendering/frame-quality';
assert.equal(combatFrameRate(true),60);assert.equal(combatFrameRate(false),30);
assert.deepEqual(renderQuality(false,3),{low:false,particles:'high',resolution:1.5});
assert.deepEqual(renderQuality(false,1),{low:false,particles:'high',resolution:1});
assert.deepEqual(renderQuality(true,3),{low:true,particles:'low',resolution:1});
assert.equal(renderQuality(false,.75).resolution,.75);
console.log('PASS manual quality selection and 60fps combat/30fps menus');
