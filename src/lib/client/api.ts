type ApiClientOpts = {
    apiKey?: string;
    baseUrl?: string;
}

export class ApiClient {
    private opts: ApiClientOpts = {}
    constructor(
        opts?: Partial<ApiClientOpts>
    ){
        if (opts) this.opts = { ...opts };
        if (!this.opts.baseUrl) throw new Error('baseUrl must be set.');
        if (!this.opts.apiKey) throw new Error('apiKey must be set.');
    }

    private _fetch = async <T extends Record<string, any>>(
        method: 'get' | 'post' | 'delete',
        route: string,
        input?: {
            query?: T,
            json?: T,
            form?: T
        },
        headers?: {
            'x-api-key'?: string;
            'Content-Type'?: string;
        }
     ) => {
        const _route = route.startsWith('/') ? route : `/${route}`;
        const url = new URL(this.opts?.baseUrl + _route);
        const _headers = {
            'x-api-key': this.opts.apiKey,
            ...headers
        };
        let qs,body:string|object|FormData|undefined;
        if (input) {
            if (input.query) qs = new URLSearchParams(input.query);
            if (input.json) {
                body = JSON.stringify(input.json);
                _headers['Content-Type'] = 'application/json';
            }
            if (input.form) {
                if (input.form instanceof FormData) {
                    body = input.form;
                } else {
                    body = new FormData();
                    Object.keys(input.form).forEach(key => {
                        input.form
                        && (body instanceof FormData)
                        && input.form[key] !== undefined
                        && body.append(key, typeof input.form[key] !== 'string' ? JSON.stringify(input.form[key]) : input.form[key])
                    });
                }
            }
        }
        const baseUrl = url.toString() + (qs ? `?${qs.toString()}` : '');
        // @ts-ignore
        const req = await fetch(baseUrl, { method, headers: _headers, body });
        if (req.status !== 200) throw new Error(`${req.status} ${await req.text()}`);
        return req;
    }

    $get = async <T extends Record<string, any>>(
        route: string,
        input?: {
            query?: T,
            json?: T,
            form?: T
        },
        headers?: {
            'Content-Type'?: string;
        }
    ) => {
        return this._fetch('get',route,input,headers);
    }
    $post = async <T extends Record<string, any>>(
        route: string,
        input?: {
            query?: T,
            json?: T,
            form?: T
        },
        headers?: {
            'Content-Type'?: string;
        }
    ) => {
        return this._fetch('post',route,input,headers);
    }
    $delete = async <T extends Record<string, any>>(
        route: string,
        input?: {
            query?: T,
            json?: T,
            form?: T
        },
        headers?: {
            'Content-Type'?: string;
        }
    ) => {
        return this._fetch('delete',route,input,headers);
    }
};