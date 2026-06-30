import { LessonMetaSchema, type LessonMeta } from "@hasystor/content-schema";

const meta: LessonMeta = LessonMetaSchema.parse({
  id: "m10-http",
  moduleId: "m10-networking",
  title: "HTTP Basics and Parsing",
  order: 3,
  estMinutes: 22,
  objectives: [
    "Describe the structure of an HTTP request and response",
    "Parse a request line and headers",
    "Explain how message length is determined (Content-Length, chunked)",
    "Recognize statelessness and common methods/status codes",
  ],
  prereqs: ["m10-sockets"],
  tags: ["networking", "http"],
  sourceRefs: ["RFC 7230", "CS:APP §11.5"],
  triviaTags: ["head-of-line"],
  relatedProblems: ["m10-p-http-parse"],
});

export default meta;
