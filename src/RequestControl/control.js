import { markRequest } from "./api.js";

export const markedRequests = new Map();

export function mark(details, rule) {
    let request = markedRequests.get(details.requestId);
    if (typeof request === "undefined") {
        markedRequests.set(details.requestId, details);
        request = details;
    }
    return markRequest(request, rule);
}

export function resolve(details, callback) {
    if (markedRequests.has(details.requestId)) {
        let request = markedRequests.get(details.requestId);
        markedRequests.delete(request.requestId);
        return request.resolve(callback);
    }
    return null;
}
