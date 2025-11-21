import { describe, test, expect } from 'bun:test';
import { Subworkflow } from '../src';
import type { Dataset, Job } from '../src/lib/types';

const { SUBWORKFLOW_API_KEY } = process.env;

describe('uploads', () => {
    test('extract (sync)', async () => {
        const subworkfow = new Subworkflow({ apiKey: SUBWORKFLOW_API_KEY });
        const file = Bun.file('./test/assets/small_5.pdf');
        const dataset = await subworkfow.extract(file,{ fileName: 'small_5.pdf' });
        expect((dataset as Dataset).itemCount).toEqual(5);
    }, 1000 * 30);

    test('extract (async)', async () => {
        const subworkfow = new Subworkflow({ apiKey: SUBWORKFLOW_API_KEY });
        const file = Bun.file('./test/assets/small_5.pdf');
        const job = await subworkfow.extract(file,{ fileName: 'small_5.pdf', async: true });
        expect((job as Job).type).toEqual('datasets/extract');
    }, 1000 * 30);

    test('vectorize (sync)', async () => {
        const subworkfow = new Subworkflow({ apiKey: SUBWORKFLOW_API_KEY });
        const file = Bun.file('./test/assets/small_5.pdf');
        const dataset = await subworkfow.vectorize(file,{ fileName: 'small_5.pdf', expiryInDays: 1 });
        expect((dataset as Dataset).itemCount).toEqual(5);
    }, 1000 * 30);

    test('vectorize (async)', async () => {
        const subworkfow = new Subworkflow({ apiKey: SUBWORKFLOW_API_KEY });
        const file = Bun.file('./test/assets/small_5.pdf');
        const job = await subworkfow.vectorize(file,{ fileName: 'small_5.pdf', expiryInDays: 1, async: true });
        expect((job as Job).type).toEqual('datasets/extract');
    }, 1000 * 30);
});

describe('upload-session', () => {
    test('mid (164mb)', async () => {
        const subworkfow = new Subworkflow({ apiKey: SUBWORKFLOW_API_KEY });
        const file = Bun.file('./test/assets/mid_164.pdf');
        const dataset = await subworkfow.extract(file,{ fileName: 'mid_164.pdf' });
        expect((dataset as Dataset).itemCount).toEqual(1447);
    },1000 * 60 * 5);
})