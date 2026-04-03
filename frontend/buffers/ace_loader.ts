import ace from "ace-builds";

(window as any).ace = ace;
(window as any).ace.acequire = ace.require;
(window as any).ace.config.set("loadWorkerFromBlob", false);
