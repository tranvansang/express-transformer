import express from 'express';
export declare class TransformationError extends Error {
    constructor(message: string);
}
export declare const errorKey = "__transformationErrors";
declare type Path = string | string[];
declare type Request = express.Request & {
    [key: string]: {
        location: string;
        path: Path;
        error: Error;
    }[];
};
declare type Option = {
    location: string;
    path: string;
    req: Request;
};
declare type MessageOption = {
    location: string;
    path: Path;
    req: Request;
};
declare type TransformedValue<T, V> = string | number | T | V;
declare type OptionalPromise<T> = T | Promise<T>;
declare type SingleCallback<T, V> = (value: T, option: Option) => OptionalPromise<TransformedValue<T, V>>;
declare type ArrayCallback<T, V> = (value: T[], option: Option) => OptionalPromise<TransformedValue<T, V>[]>;
declare type MessageCallback<T> = (value: T | T[], option: MessageOption) => OptionalPromise<string>;
declare type Callback<T, V> = string | SingleCallback<T, V> | ArrayCallback<T, V> | MessageCallback<T>;
interface Middleware<T, V> {
    (req: Request, res: express.Response, next: express.NextFunction): Promise<void>;
    transform(callback: Callback<T, V>, option?: {
        force?: boolean;
    }): Middleware<T, V>;
    message(callback: Callback<T, V>, option?: {
        force?: boolean;
    }): Middleware<T, V>;
    every(callback: Callback<T, V>, option?: {
        force?: boolean;
    }): Middleware<T, V>;
    each(callback: Callback<T, V>, option?: {
        force?: boolean;
    }): Middleware<T, V>;
    exists(option?: {
        acceptEmptyString?: boolean;
    }): Middleware<T, V>;
    trim(): Middleware<T, V>;
    defaultValue(defaultValue: V): Middleware<T, V>;
    [key: string]: ((options?: any) => Middleware<T, V>) | ((callback: Callback<T, V>, option?: {
        force?: boolean;
    }) => Middleware<T, V>);
}
export declare const transformationResult: (req: Request) => {
    location: string;
    path: string | string[];
    error: Error;
}[];
declare function transformer<T, V>(path: Path, { location, nonstop }?: {
    location?: string | undefined;
    nonstop?: boolean | undefined;
}): Middleware<T, V>;
export default transformer;
