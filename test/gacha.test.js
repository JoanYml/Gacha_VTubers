import {test} from 'node:test';
import assert from 'node:assert/strict';
import {freshState,pull,restoreState,characters} from '../src/gacha.js';
test('80th wish guarantees a character and resets pity',()=>{const s=freshState();s.pity=79;const r=pull(s,1,()=>0.99);assert.equal(r.results[0].stars,5);assert.equal(r.state.pity,0);assert.equal(r.state.gems,15840);assert.equal(s.pity,79);});
test('ten wishes charge once and accumulate rewards',()=>{const r=pull(freshState(),10,()=>0.5);assert.equal(r.results.length,10);assert.equal(r.state.gems,14400);assert.equal(r.state.total,10);assert.equal(r.state.pity,10);assert.equal(Object.values(r.state.inventory).reduce((a,b)=>a+b,0),10);});
test('insufficient funds cannot mutate progress',()=>{const s=freshState();s.gems=0;assert.throws(()=>pull(s,10));assert.equal(s.total,0);});
test('all five characters can be drawn',()=>{characters.forEach((c,i)=>{let n=0;const r=pull(freshState(),1,()=>n++===0?0:(i+.5)/5);assert.equal(r.results[0].id,c.id);assert.equal(r.results[0].isNew,true);});});
test('duplicates increment collection and stop being new',()=>{let s=freshState();s=pull(s,1,()=>0).state;const r=pull(s,1,()=>0);assert.equal(r.results[0].isNew,false);assert.equal(r.state.inventory.gabu,2);});
test('corrupt storage recovers and valid storage round trips',()=>{assert.deepEqual(restoreState('invalid'),freshState());assert.deepEqual(restoreState(JSON.stringify(freshState())),freshState());assert.deepEqual(restoreState('{"gems":-1}'),freshState());});
