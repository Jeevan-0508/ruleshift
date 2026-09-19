import { describe, it, expect } from 'vitest';
import { RuleEngine } from '../engine/ruleEngine';
import { InferenceEngine } from '../engine/inferenceEngine';
import { LEVEL_1 } from '../levels/handAuthored';

describe('InferenceEngine', () => {
  it('does not confirm a rule from a single observation', () => {
    const engine = new RuleEngine(LEVEL_1);
    const inference = new InferenceEngine();
    engine.move('RIGHT');
    engine.move('RIGHT'); // touches blue once -> rule fires once
    const confirmed = inference.ingest(engine.log.all());
    expect(confirmed.length).toBe(0);
  });

  it('confirms a rule once enough repeated evidence accumulates', () => {
    const engine = new RuleEngine(LEVEL_1);
    const inference = new InferenceEngine();
    // touch blue, respawn, touch blue again -> 2 pieces of evidence for the same rule
    engine.move('RIGHT');
    engine.move('RIGHT');
    inference.ingest(engine.log.all());
    engine.respawn();
    engine.move('RIGHT');
    engine.move('RIGHT');
    const confirmed = inference.ingest(engine.log.all());
    expect(confirmed.some((o) => o.id.startsWith('BLUE'))).toBe(true);
  });
});
