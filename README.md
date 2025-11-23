<h3 align="center">
  <a name="readme-top"></a>
    <img
        src="https://cdn.subworkflow.ai/marketing/logo-blue-100x100.png"
    />
</h3>
<h4 align="center" style="font-family:monospace">RAG BACKEND API FOR AI DEVELOPERS</h4>
<div align="center">
    <a href="https://www.linkedin.com/company/subworkflow-ai">
        <img src="https://img.shields.io/badge/Follow%20on%20LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" alt="Follow on LinkedIn" />
    </a>
    <a href="https://twitter.com/subworkflow">
        <img src="https://img.shields.io/badge/Follow%20on%20X-000000?style=for-the-badge&logo=x&logoColor=white" alt="Follow on X" />
    </a>
    <a href="https://discord.gg/RCHeCPJnYw">
        <img src="https://img.shields.io/badge/Community%20Support%20-5865F2?style=for-the-badge&logo=discord&logoColor=white" alt="Need Support?" />
    </a>
</div>

# Subworkflow-JS-SDK <img src="https://cdn.subworkflow.ai/marketing/logo-blue-32x32.png" height="24"/>

The **Subworkflow-JS-SDK** is the official server-side javascript sdk for the [Subworkflow.ai](https://subworkflow.ai) API written in Typescript.

Note: This sdk is not intended to be used in the browser and doing so may expose your API key to unauthorized use.

Please use this project's [issue tracker](https://github.com/Subworkflow-AI/subworkflow-js-sdk/issues) for any issues and/or support relating to this library. You can also reach out to the team on [our Discord server](https://discord.gg/RCHeCPJnYw).

## What is Subworkflow.AI

Subworkflow.AI is a RAG backend API designed and built to handle document RAG with large documents; where large documents are typically scanned PDFs, 1000+ pages, 300mb+ or a combination thereof. 

Subworkflow.AI is able to split, index, store and vectorize these documents and provide a simple API to access, filter and search the resulting pages of one or more documents uploaded to the service. The aim is to handle this backend portion of the RAG application so developers can focus on the frontend.

Subworkflow's document processing pipeline is also great for high frequency structured output for smaller documents (<300 page) where it's necessary to perform similar splitting and retrieval for bank statements, contracts and policy documents.

Learn more by visiting our website at [https://subworkflow.ai](https://subworkflow.ai).

## Installation

```
npm i --save @subworkflow/sdk
```

## Usage

Initialise the client from `@subworkflow/sdk` with your workspace's API key. This will scope all operations to the workspace.
```typescript
import { Subworkflow } from '@subworkflow/sdk';

const subworkflow = new Subworkflow({
    apiKey: '<MY-API-KEY>'
});
```
### 1. Extract & Query Usage
Uploads a document and allows fetching any page or any range of pages in both pdf and jpg formats. Great for use-cases such as Structured Outputs (extracting properties) or Grounding (showing source of LLM's answers).
```typescript
import * as fs from 'fs';
const fileBuffer = fs.readFileSync('/path/to/file.pdf');

// 1. upload a file to get its dataset
const dataset = await subworkflow.extract(fileBuffer);

// 2. retrieve a selection of pages from dataset
const results = await subworkflow.datasets.query(dataset, {
    row: 'jpg',
    cols: [1,2,3], // omit to retrieve all
    offset: 0,
    limit: 10
});

// 3. use the selection of pages in your favourite LLM
import OpenAI from "openai";
const openai = new OpenAI();

const response = await openai.responses.create({
    model: "gpt-4.1-mini",
    input: [{
        role: "user",
        content: [
            { type: "input_text", text: "Please classify these pages." },
            ...results.map(datasetItem => ({
                type: "input_image",
                image_url: datasetItem.share.url
            })
        ]
    }]
});

console.log(response.output_text);
```

### Vectorize & Search Usage
```typescript
import * as fs from 'fs';
const fileBuffer = fs.readFileSync('/path/to/file.pdf');

// 1. upload a file to get its dataset
// alternatively, use `await datasets.vectorize();` if dataset is alrady extracted
const dataset = await subworkflow.vectorize(fileBuffer);

// 2. query the document contextually to return matching pages
const results = await subworkflow.search({
    datasets: [dataset],
    query: {
        "text": "Can you find this symbol in the document?",
        "image_url": "https://www.food.gov.uk/sites/default/files/styles/promo_large/public/media/image/food-hygiene-Rating%205_a_preview.jpeg"
    },
    offset: 0,
    limit: 10
});

// 3. Use your fave LLM to generate an answer
import OpenAI from "openai";
const openai = new OpenAI();

const response = await openai.responses.create({
    model: "gpt-4.1-mini",
    input: [{
        role: "user",
        content: [
            {
                type: "input_text",
                text: "Summarize the procedures and penalties for early lease termination from these pages."
            },
            ...results.map(datasetItem => ({
                type: "input_image",
                image_url: datasetItem.share.url
            })
        ]
    }]
});

console.log(response.output_text);
console.log(`Pages cited for this answer are: ${results.map(datasetItem => datasetItem.col).join(',)}`)
```

## API Reference

### Extract
```typescript
.extract(
    file: Blob,
    opts: {
        fileName: string;
        async?: boolean; 
        expiryInDays?: number;
        chunkSize?: number; 
        concurrency?: number;
    }
): Promise<Dataset | Job>
```
* Unless `async` is set to true, this function will perform polling on the `job` record automatically
* For files over 100mb, this function automatically switches to Multipart Upload mode.
* API reference: https://docs.subworkflow.ai/api-reference/post-v1-extract

**Params**:
 * **file** (Blob) - *Required*. the document file to upload and extract
 * **opts.fileName** (boolean) - *Required*. Sets the filename for the uploaded file.
 * **opts.async?** (boolean) - *Optional*. Set to true to skip auto-polling for job completion and receive the job record instead. Defaults to false.
 * **opts.expiresInDays?** (number) - *Optional*. Overrides the number of days before file expiration. Default is maximum data rentention value for your subscription.
 * **opts.chunkSize?** (number) - *Optional*. MultipartUpload only. Sets the part size for splitting. Defaults to 10mb.
 * **opts.concurrency?** (number) - *Optional*. MultipartUpload only. Sets how many part uploads execute simultaneously. Defaults to 4.

**Returns** either a `Dataset` or `Job`:
 * `Promise<Dataset>` (Dataset) - The dataset object, when `opts.async=false`.
 * `Promise<Job>` (Job) - The job object, when `opts.async=true`

When a `Job` is returned, you'll have to check the job status for the dataset manually.

### Vectorize
```typescript
.vectorize(
    file: Blob,
    opts: {
        fileName: string;
        async?: boolean; 
        expiryInDays?: number;
        chunkSize?: number; 
        concurrency?: number;
    }
): Promise<Dataset | Job>
```
* Unless `async` is set to true, this function will perform polling on the `job` record automatically.
* For files over 100mb, this function automatically switches to Multipart Upload mode.
* Api Reference: https://docs.subworkflow.ai/api-reference/post-v1-vectorize

**Params**:
 * **file** (blob) - *Required*. the document file to upload and vectorize
 * **opts.fileName** (boolean) - *Required*. Sets the filename for the uploaded file.
 * **opts.async?** (boolean) - *Optional*. Set to true to skip auto-polling for job completion and receive the job record instead. Defaults to false.
 * **opts.expiresInDays?** (number) - *Optional*. Overrides the number of days before file expiration. Default is maximum data rentention value for your subscription.
 * **opts.chunkSize?** (number) - *Optional*. MultipartUpload only. Sets the part size for splitting. Defaults to 10mb.
 * **opts.concurrency?** (number) - *Optional*. MultipartUpload only. Sets how many part uploads execute simultaneously. Defaults to 4.

**Returns** either a `Dataset` or `Job`:
 * `Promise<Dataset>` (Dataset) - The dataset object, when `opts.async=false`.
 * `Promise<Job>` (Job) - The job object, when `opts.async=true`

When a `Job` is returned, you'll have to check the job status for the dataset manually.

### Datasets List
```typescript
.datasets.list(
    opts?: {
        type?: "doc",
        sort?: string | string[];
        offset?: number;
        limit?: number;
        expiryInSeconds?: number;
    }
): Promise<DatasetItem[]>;
```
* List all available Datasets (documents) in current workspace

**Params**:
 * **opts?.type** (Dataset | string) - *Required*. This is always "doc" for now.
 * **opts?.sort?** (string | string[]) - *optional*. Dataset property to sort results by, prepend `-` for desc order eg. `createdAt` for createdAt asc and `-createdAt` for createdAt desc. default is `createdAt` descending.
 * **opts.offset?** (number) - *optional*.  default is 0.
 * **opts.limit?** (number) - *optional*. Max 100. default is 10.
 * **opts.expiryInSeconds?** (number) - *optional*. Overrides the expiration duration for the file share. default is 10 mins.

**Returns**
* `Array<Dataset>` (Dataset[]) - An array of matching Dataset objects.

### Datasets Get
```typescript
.datasets.get(datasetId: string): Promise<Dataset | null>
```
* Returns a single dataset by Id

**Params**:
 * **datasetId** (string) - *Required*. the datasetId of the requested dataset

**Returns**
* `Dataset` (Dataset) - The dataset object.

### Datasets Delete
```typescript
.datasets.delete(dataset: Dataset | string): Promise<Dataset | null>
```
* Marks a single dataset for deletion. This is the same as setting an immediate expiry date.
* Api Reference: https://docs.subworkflow.ai/api-reference/delete-v1-datasets-id

**Params**:
  * **dataset** (Dataset | string) - *Required*. A dataset object or the dataset ID of the requested dataset

**Returns**
* `Dataset` (Dataset) - The dataset object.

### Dataset Vectorize
```typescript
.datasets.vectorize(
    dataset: Dataset | string,
    opts?: {
        async?: boolean;
    }
): Promise<Dataset | Job>
```
* Triggers a `Vectorize` job for the dataset only if a previous `vectorize` job doesn't exist.
* Unless `async` is set to true, this function will perform polling on the `job` record automatically.
* Api Reference: https://docs.subworkflow.ai/api-reference/get-v1-datasets-id-vectorize

**Params**:
 * **dataset** (Dataset | string) - *Required*. A dataset object or the datasetId of the requested dataset
* **opts?.async?** (boolean) - *Optional*. Set to true to skip auto-polling for job completion and receive the job record instead. Defaults to false.
 
**Returns** either a `Dataset` or `Job`:
 * `Promise<Dataset>` (Dataset) - The dataset object, when `opts.async=false`.
 * `Promise<Job>` (Job) - The job object, when `opts.async=true`

When a `Job` is returned, you'll have to check the job status for the dataset manually.

### Datasets Get Items
```typescript
.datasets.getItems(
    dataset: Dataset | string,
    opts?: {
        row?: string;
        cols?: string | string[];
        sort?: string | string[];
        offset?: number;
        limit?: number;
        expiryInSeconds?: number;
    }
): Promise<DatasetItem[]>;
```
* Filters DatasetItems (pages) from a dataset.

**Params**:
 * **dataset** (Dataset | string) - *Required*. A dataset object or the datasetId of the requested dataset
 * **opts.row?** (string) - *optional*. The format of the page. Either "pdf", "image" or "embedding_image"
 * **opts.cols?** (string | string[]) - *optional*. Page number or range of page numbers inclusive. eg. `1,2,3` or `1:3` are equivalent. default is all cols are included.
 * **opts.sort?** (string | string[]) - *optional*. DatasetItem property to sort results by, prepend `-` for desc order eg. `createdAt` for createdAt asc and `-createdAt` for createdAt desc. default is `createdAt` descending.
 * **opts.offset?** (number) - *optional*.  default is 0.
 * **opts.limit?** (number) - *optional*. Max 100. default is 10.
 * **opts.expiryInSeconds?** (number) - *optional*. Overrides the expiration duration for the file share. default is 10 mins.

**Returns**
* `Array<DatasetItem>` (DatasetItem[]) - An array of matching DatasetItem objects.

### Search
```typescript
.search({
    query: string | { text: string; image_url?: string; };
    datasets: Dataset | Dataset[] | string | string[];
    sort?: string | string[];
    offset?: number;
    limit?: number;
    expiryInSeconds?: number;
});
```
* Requires `/vectorize` job executed on dataset prior to search being enabled
* Performs text and/or image search over vector store and returns matching pages
* Unless one or more `datasets` is set, searches over all datasets in vector store.

**Params**:
* **query** (string | { text: string; image_url?: string }) - *Required*. The search terms to query for. Can be either text or text and image. When searching with image, image can be publicly accessible image url or base64 string.
 * **datasets** (Dataset[] | string[]) - *Optional*. filters the search to one or more datasets. Accepts Dataset objects and/or Dataset Ids. Default is all datasets included in search.
 * **sort?** (string | string[]) - *optional*. DatasetItem property to sort results by, prepend `-` for desc order eg. `createdAt` for createdAt asc and `-createdAt` for createdAt desc. default is `createdAt` descending.
 * **offset?** (number) - *optional*. default is 0.
 * **limit?** (number) - *optional*. default is 10. Max 100.
 * **expiryInSeconds?** (number) - *optional*. Overrides the expiration duration for the file share. default is 10 mins.

**Returns**
* `Array<DatasetItem>` (DatasetItem[]) - An array of matching datasetItem objects.

### Job Get
```typescript
.jobs.get(jobId: string): Promise<Job | null>
```
**Params**
* **jobId** (string) - *Required*. The ID of the job to retrieve.

**Returns**
* `Job` (Job) - a Job object

### Job Cancel
```typescript
jobs.cancel(jobId: string): Promise<job | null>
```
* Cancels a non-completed job. You can only cancel jobs which are in the "NOT_STARTED" and "IN_PROGRESS" states.

**Params**
* **jobId** (string) - *Required*. The ID of the job to retrieve.

**Returns**
* `Job` (Job) - a Job object

### Jobs List
```typescript
.jobs.list(opts?: {
    statuses?: string | string[];
    types?: string | string[];
    offset?: number;
    limit?: number;
})
```
* Returns new and existing jobs only within the last 24hrs. Older jobs are available if retrieved by ID.
* Orderd by creation time descending.

**Params**:
 * **statuses** (string[] | string[]) - *Optional*. filters results by job status. Available statuses are `NOT_STARTED`, `IN_PROGRESS`, `SUCCESS`, `ERROR`. Default is all statuses.
 * **types** (string[] | string[]) - *Optional*. filters results by job type. Available types are `dataset/extract`, `dataset/vectorize`. Default is all types.
 * **offset?** (number) - *optional*. default is 0.
 * **limit?** (number) - *optional*. default is 10. Max 100.

**Returns**
* `Array<Job>` (Job[]) - an array of viewable jobs

## Licence

This project repository is licensed under the MIT License (See LICENSE file). Some dependencies may contain a different license so please refer to the relevant repositories for specific licences.

2025 &copy; Subworkflow AI Limited.
The fastest way to build durable RAG applications.