import { describe, test, expect, beforeAll } from 'bun:test';
import { Subworkflow } from '../src';

const { SUBWORKFLOW_API_KEY } = process.env;

describe('jobs', () => {
    const subworkfow = new Subworkflow({ apiKey: SUBWORKFLOW_API_KEY });

    test('jobs.list', async () => {
        const actual = await subworkfow.jobs.list();
        expect(actual?.length).toBeGreaterThan(0);
    });
});