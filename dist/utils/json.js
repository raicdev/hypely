import { createRequire } from "node:module";
var __create = Object.create;
var __getProtoOf = Object.getPrototypeOf;
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __toESM = (mod, isNodeMode, target) => {
  target = mod != null ? __create(__getProtoOf(mod)) : {};
  const to = isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target;
  for (let key of __getOwnPropNames(mod))
    if (!__hasOwnProp.call(to, key))
      __defProp(to, key, {
        get: () => mod[key],
        enumerable: true
      });
  return to;
};
var __commonJS = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {
      get: all[name],
      enumerable: true,
      configurable: true,
      set: (newValue) => all[name] = () => newValue
    });
};
var __require = /* @__PURE__ */ createRequire(import.meta.url);

// node_modules/.pnpm/fast-deep-equal@3.1.3/node_modules/fast-deep-equal/index.js
var require_fast_deep_equal = __commonJS((exports, module) => {
  module.exports = function equal(a, b) {
    if (a === b)
      return true;
    if (a && b && typeof a == "object" && typeof b == "object") {
      if (a.constructor !== b.constructor)
        return false;
      var length, i, keys;
      if (Array.isArray(a)) {
        length = a.length;
        if (length != b.length)
          return false;
        for (i = length;i-- !== 0; )
          if (!equal(a[i], b[i]))
            return false;
        return true;
      }
      if (a.constructor === RegExp)
        return a.source === b.source && a.flags === b.flags;
      if (a.valueOf !== Object.prototype.valueOf)
        return a.valueOf() === b.valueOf();
      if (a.toString !== Object.prototype.toString)
        return a.toString() === b.toString();
      keys = Object.keys(a);
      length = keys.length;
      if (length !== Object.keys(b).length)
        return false;
      for (i = length;i-- !== 0; )
        if (!Object.prototype.hasOwnProperty.call(b, keys[i]))
          return false;
      for (i = length;i-- !== 0; ) {
        var key = keys[i];
        if (!equal(a[key], b[key]))
          return false;
      }
      return true;
    }
    return a !== a && b !== b;
  };
});

// node_modules/.pnpm/json-schema-ref-resolver@1.0.1/node_modules/json-schema-ref-resolver/index.js
var require_json_schema_ref_resolver = __commonJS((exports, module) => {
  var deepEqual = require_fast_deep_equal();
  var jsonSchemaRefSymbol = Symbol.for("json-schema-ref");

  class RefResolver {
    #schemas;
    #derefSchemas;
    #insertRefSymbol;
    #allowEqualDuplicates;
    #cloneSchemaWithoutRefs;
    constructor(opts = {}) {
      this.#schemas = {};
      this.#derefSchemas = {};
      this.#insertRefSymbol = opts.insertRefSymbol ?? false;
      this.#allowEqualDuplicates = opts.allowEqualDuplicates ?? true;
      this.#cloneSchemaWithoutRefs = opts.cloneSchemaWithoutRefs ?? false;
    }
    addSchema(schema, schemaId) {
      if (schema.$id !== undefined && schema.$id.charAt(0) !== "#") {
        schemaId = schema.$id;
      } else {
        this.#insertSchemaBySchemaId(schema, schemaId);
      }
      this.#addSchema(schema, schemaId);
    }
    getSchema(schemaId, jsonPointer = "#") {
      const schema = this.#schemas[schemaId];
      if (schema === undefined) {
        throw new Error(`Cannot resolve ref "${schemaId}${jsonPointer}". Schema with id "${schemaId}" is not found.`);
      }
      if (schema.anchors[jsonPointer] !== undefined) {
        return schema.anchors[jsonPointer];
      }
      return getDataByJSONPointer(schema.schema, jsonPointer);
    }
    hasSchema(schemaId) {
      return this.#schemas[schemaId] !== undefined;
    }
    getSchemaRefs(schemaId) {
      const schema = this.#schemas[schemaId];
      if (schema === undefined) {
        throw new Error(`Schema with id "${schemaId}" is not found.`);
      }
      return schema.refs;
    }
    getSchemaDependencies(schemaId, dependencies = {}) {
      const schema = this.#schemas[schemaId];
      for (const ref of schema.refs) {
        const dependencySchemaId = ref.schemaId;
        if (dependencies[dependencySchemaId] !== undefined)
          continue;
        dependencies[dependencySchemaId] = this.getSchema(dependencySchemaId);
        this.getSchemaDependencies(dependencySchemaId, dependencies);
      }
      return dependencies;
    }
    derefSchema(schemaId) {
      if (this.#derefSchemas[schemaId] !== undefined)
        return;
      const schema = this.#schemas[schemaId];
      if (schema === undefined) {
        throw new Error(`Schema with id "${schemaId}" is not found.`);
      }
      if (!this.#cloneSchemaWithoutRefs && schema.refs.length === 0) {
        this.#derefSchemas[schemaId] = {
          schema: schema.schema,
          anchors: schema.anchors
        };
      }
      const refs = [];
      this.#addDerefSchema(schema.schema, schemaId, refs);
      const dependencies = this.getSchemaDependencies(schemaId);
      for (const schemaId2 in dependencies) {
        const schema2 = dependencies[schemaId2];
        this.#addDerefSchema(schema2, schemaId2, refs);
      }
      for (const ref of refs) {
        const {
          refSchemaId,
          refJsonPointer
        } = this.#parseSchemaRef(ref.ref, ref.sourceSchemaId);
        const targetSchema = this.getDerefSchema(refSchemaId, refJsonPointer);
        if (targetSchema === null) {
          throw new Error(`Cannot resolve ref "${ref.ref}". Ref "${refJsonPointer}" is not found in schema "${refSchemaId}".`);
        }
        ref.targetSchema = targetSchema;
        ref.targetSchemaId = refSchemaId;
      }
      for (const ref of refs) {
        this.#resolveRef(ref, refs);
      }
    }
    getDerefSchema(schemaId, jsonPointer = "#") {
      let derefSchema = this.#derefSchemas[schemaId];
      if (derefSchema === undefined) {
        this.derefSchema(schemaId);
        derefSchema = this.#derefSchemas[schemaId];
      }
      if (derefSchema.anchors[jsonPointer] !== undefined) {
        return derefSchema.anchors[jsonPointer];
      }
      return getDataByJSONPointer(derefSchema.schema, jsonPointer);
    }
    #parseSchemaRef(ref, schemaId) {
      const sharpIndex = ref.indexOf("#");
      if (sharpIndex === -1) {
        return { refSchemaId: ref, refJsonPointer: "#" };
      }
      if (sharpIndex === 0) {
        return { refSchemaId: schemaId, refJsonPointer: ref };
      }
      return {
        refSchemaId: ref.slice(0, sharpIndex),
        refJsonPointer: ref.slice(sharpIndex)
      };
    }
    #addSchema(schema, rootSchemaId) {
      const schemaId = schema.$id;
      if (schemaId !== undefined && typeof schemaId === "string") {
        if (schemaId.charAt(0) === "#") {
          this.#insertSchemaByAnchor(schema, rootSchemaId, schemaId);
        } else {
          this.#insertSchemaBySchemaId(schema, schemaId);
          rootSchemaId = schemaId;
        }
      }
      const ref = schema.$ref;
      if (ref !== undefined && typeof ref === "string") {
        const { refSchemaId, refJsonPointer } = this.#parseSchemaRef(ref, rootSchemaId);
        this.#schemas[rootSchemaId].refs.push({
          schemaId: refSchemaId,
          jsonPointer: refJsonPointer
        });
      }
      for (const key in schema) {
        if (typeof schema[key] === "object" && schema[key] !== null) {
          this.#addSchema(schema[key], rootSchemaId);
        }
      }
    }
    #addDerefSchema(schema, rootSchemaId, refs = []) {
      const derefSchema = Array.isArray(schema) ? [...schema] : { ...schema };
      const schemaId = derefSchema.$id;
      if (schemaId !== undefined && typeof schemaId === "string") {
        if (schemaId.charAt(0) === "#") {
          this.#insertDerefSchemaByAnchor(derefSchema, rootSchemaId, schemaId);
        } else {
          this.#insertDerefSchemaBySchemaId(derefSchema, schemaId);
          rootSchemaId = schemaId;
        }
      }
      if (derefSchema.$ref !== undefined) {
        refs.push({
          ref: derefSchema.$ref,
          sourceSchemaId: rootSchemaId,
          sourceSchema: derefSchema
        });
      }
      for (const key in derefSchema) {
        const value = derefSchema[key];
        if (typeof value === "object" && value !== null) {
          derefSchema[key] = this.#addDerefSchema(value, rootSchemaId, refs);
        }
      }
      return derefSchema;
    }
    #resolveRef(ref, refs) {
      const { sourceSchema, targetSchema } = ref;
      if (!sourceSchema.$ref)
        return;
      if (this.#insertRefSymbol) {
        sourceSchema[jsonSchemaRefSymbol] = sourceSchema.$ref;
      }
      delete sourceSchema.$ref;
      if (targetSchema.$ref) {
        const targetSchemaRef = refs.find((ref2) => ref2.sourceSchema === targetSchema);
        this.#resolveRef(targetSchemaRef, refs);
      }
      for (const key in targetSchema) {
        if (key === "$id")
          continue;
        if (sourceSchema[key] !== undefined) {
          if (deepEqual(sourceSchema[key], targetSchema[key]))
            continue;
          throw new Error(`Cannot resolve ref "${ref.ref}". Property "${key}" is already exist in schema "${ref.sourceSchemaId}".`);
        }
        sourceSchema[key] = targetSchema[key];
      }
      ref.isResolved = true;
    }
    #insertSchemaBySchemaId(schema, schemaId) {
      const foundSchema = this.#schemas[schemaId];
      if (foundSchema !== undefined) {
        if (this.#allowEqualDuplicates && deepEqual(schema, foundSchema.schema))
          return;
        throw new Error(`There is already another schema with id "${schemaId}".`);
      }
      this.#schemas[schemaId] = { schema, anchors: {}, refs: [] };
    }
    #insertSchemaByAnchor(schema, schemaId, anchor) {
      const { anchors } = this.#schemas[schemaId];
      if (anchors[anchor] !== undefined) {
        throw new Error(`There is already another anchor "${anchor}" in a schema "${schemaId}".`);
      }
      anchors[anchor] = schema;
    }
    #insertDerefSchemaBySchemaId(schema, schemaId) {
      const foundSchema = this.#derefSchemas[schemaId];
      if (foundSchema !== undefined)
        return;
      this.#derefSchemas[schemaId] = { schema, anchors: {} };
    }
    #insertDerefSchemaByAnchor(schema, schemaId, anchor) {
      const { anchors } = this.#derefSchemas[schemaId];
      anchors[anchor] = schema;
    }
  }
  function getDataByJSONPointer(data, jsonPointer) {
    const parts = jsonPointer.split("/");
    let current = data;
    for (const part of parts) {
      if (part === "" || part === "#")
        continue;
      if (typeof current !== "object" || current === null) {
        return null;
      }
      current = current[part];
    }
    return current ?? null;
  }
  module.exports = { RefResolver };
});

// node_modules/.pnpm/fast-json-stringify@5.16.1/node_modules/fast-json-stringify/lib/serializer.js
var require_serializer = __commonJS((exports, module) => {
  var STR_ESCAPE = /[\u0000-\u001f\u0022\u005c\ud800-\udfff]/;
  module.exports = class Serializer {
    constructor(options) {
      switch (options && options.rounding) {
        case "floor":
          this.parseInteger = Math.floor;
          break;
        case "ceil":
          this.parseInteger = Math.ceil;
          break;
        case "round":
          this.parseInteger = Math.round;
          break;
        case "trunc":
        default:
          this.parseInteger = Math.trunc;
          break;
      }
      this._options = options;
    }
    asInteger(i) {
      if (Number.isInteger(i)) {
        return "" + i;
      } else if (typeof i === "bigint") {
        return i.toString();
      }
      const integer = this.parseInteger(i);
      if (integer === Infinity || integer === -Infinity || integer !== integer) {
        throw new Error(`The value "${i}" cannot be converted to an integer.`);
      }
      return "" + integer;
    }
    asNumber(i) {
      const num = Number(i);
      if (num !== num) {
        throw new Error(`The value "${i}" cannot be converted to a number.`);
      } else if (num === Infinity || num === -Infinity) {
        return "null";
      } else {
        return "" + num;
      }
    }
    asBoolean(bool) {
      return bool && "true" || "false";
    }
    asDateTime(date) {
      if (date === null)
        return '""';
      if (date instanceof Date) {
        return '"' + date.toISOString() + '"';
      }
      if (typeof date === "string") {
        return '"' + date + '"';
      }
      throw new Error(`The value "${date}" cannot be converted to a date-time.`);
    }
    asDate(date) {
      if (date === null)
        return '""';
      if (date instanceof Date) {
        return '"' + new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10) + '"';
      }
      if (typeof date === "string") {
        return '"' + date + '"';
      }
      throw new Error(`The value "${date}" cannot be converted to a date.`);
    }
    asTime(date) {
      if (date === null)
        return '""';
      if (date instanceof Date) {
        return '"' + new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(11, 19) + '"';
      }
      if (typeof date === "string") {
        return '"' + date + '"';
      }
      throw new Error(`The value "${date}" cannot be converted to a time.`);
    }
    asString(str) {
      const len = str.length;
      if (len < 42) {
        let result = "";
        let last = -1;
        let point = 255;
        for (var i = 0;i < len; i++) {
          point = str.charCodeAt(i);
          if (point === 34 || point === 92) {
            last === -1 && (last = 0);
            result += str.slice(last, i) + "\\";
            last = i;
          } else if (point < 32 || point >= 55296 && point <= 57343) {
            return JSON.stringify(str);
          }
        }
        return last === -1 && '"' + str + '"' || '"' + result + str.slice(last) + '"';
      } else if (len < 5000 && STR_ESCAPE.test(str) === false) {
        return '"' + str + '"';
      } else {
        return JSON.stringify(str);
      }
    }
    asUnsafeString(str) {
      return '"' + str + '"';
    }
    getState() {
      return this._options;
    }
    static restoreFromState(state) {
      return new Serializer(state);
    }
  };
});

// node_modules/.pnpm/ajv@8.17.1/node_modules/ajv/dist/compile/codegen/code.js
var require_code = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.regexpCode = exports.getEsmExportName = exports.getProperty = exports.safeStringify = exports.stringify = exports.strConcat = exports.addCodeArg = exports.str = exports._ = exports.nil = exports._Code = exports.Name = exports.IDENTIFIER = exports._CodeOrName = undefined;

  class _CodeOrName {
  }
  exports._CodeOrName = _CodeOrName;
  exports.IDENTIFIER = /^[a-z$_][a-z$_0-9]*$/i;

  class Name extends _CodeOrName {
    constructor(s) {
      super();
      if (!exports.IDENTIFIER.test(s))
        throw new Error("CodeGen: name must be a valid identifier");
      this.str = s;
    }
    toString() {
      return this.str;
    }
    emptyStr() {
      return false;
    }
    get names() {
      return { [this.str]: 1 };
    }
  }
  exports.Name = Name;

  class _Code extends _CodeOrName {
    constructor(code) {
      super();
      this._items = typeof code === "string" ? [code] : code;
    }
    toString() {
      return this.str;
    }
    emptyStr() {
      if (this._items.length > 1)
        return false;
      const item = this._items[0];
      return item === "" || item === '""';
    }
    get str() {
      var _a;
      return (_a = this._str) !== null && _a !== undefined ? _a : this._str = this._items.reduce((s, c) => `${s}${c}`, "");
    }
    get names() {
      var _a;
      return (_a = this._names) !== null && _a !== undefined ? _a : this._names = this._items.reduce((names, c) => {
        if (c instanceof Name)
          names[c.str] = (names[c.str] || 0) + 1;
        return names;
      }, {});
    }
  }
  exports._Code = _Code;
  exports.nil = new _Code("");
  function _(strs, ...args) {
    const code = [strs[0]];
    let i = 0;
    while (i < args.length) {
      addCodeArg(code, args[i]);
      code.push(strs[++i]);
    }
    return new _Code(code);
  }
  exports._ = _;
  var plus = new _Code("+");
  function str(strs, ...args) {
    const expr = [safeStringify(strs[0])];
    let i = 0;
    while (i < args.length) {
      expr.push(plus);
      addCodeArg(expr, args[i]);
      expr.push(plus, safeStringify(strs[++i]));
    }
    optimize(expr);
    return new _Code(expr);
  }
  exports.str = str;
  function addCodeArg(code, arg) {
    if (arg instanceof _Code)
      code.push(...arg._items);
    else if (arg instanceof Name)
      code.push(arg);
    else
      code.push(interpolate(arg));
  }
  exports.addCodeArg = addCodeArg;
  function optimize(expr) {
    let i = 1;
    while (i < expr.length - 1) {
      if (expr[i] === plus) {
        const res = mergeExprItems(expr[i - 1], expr[i + 1]);
        if (res !== undefined) {
          expr.splice(i - 1, 3, res);
          continue;
        }
        expr[i++] = "+";
      }
      i++;
    }
  }
  function mergeExprItems(a, b) {
    if (b === '""')
      return a;
    if (a === '""')
      return b;
    if (typeof a == "string") {
      if (b instanceof Name || a[a.length - 1] !== '"')
        return;
      if (typeof b != "string")
        return `${a.slice(0, -1)}${b}"`;
      if (b[0] === '"')
        return a.slice(0, -1) + b.slice(1);
      return;
    }
    if (typeof b == "string" && b[0] === '"' && !(a instanceof Name))
      return `"${a}${b.slice(1)}`;
    return;
  }
  function strConcat(c1, c2) {
    return c2.emptyStr() ? c1 : c1.emptyStr() ? c2 : str`${c1}${c2}`;
  }
  exports.strConcat = strConcat;
  function interpolate(x) {
    return typeof x == "number" || typeof x == "boolean" || x === null ? x : safeStringify(Array.isArray(x) ? x.join(",") : x);
  }
  function stringify(x) {
    return new _Code(safeStringify(x));
  }
  exports.stringify = stringify;
  function safeStringify(x) {
    return JSON.stringify(x).replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
  }
  exports.safeStringify = safeStringify;
  function getProperty(key) {
    return typeof key == "string" && exports.IDENTIFIER.test(key) ? new _Code(`.${key}`) : _`[${key}]`;
  }
  exports.getProperty = getProperty;
  function getEsmExportName(key) {
    if (typeof key == "string" && exports.IDENTIFIER.test(key)) {
      return new _Code(`${key}`);
    }
    throw new Error(`CodeGen: invalid export name: ${key}, use explicit $id name mapping`);
  }
  exports.getEsmExportName = getEsmExportName;
  function regexpCode(rx) {
    return new _Code(rx.toString());
  }
  exports.regexpCode = regexpCode;
});

// node_modules/.pnpm/ajv@8.17.1/node_modules/ajv/dist/compile/codegen/scope.js
var require_scope = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.ValueScope = exports.ValueScopeName = exports.Scope = exports.varKinds = exports.UsedValueState = undefined;
  var code_1 = require_code();

  class ValueError extends Error {
    constructor(name) {
      super(`CodeGen: "code" for ${name} not defined`);
      this.value = name.value;
    }
  }
  var UsedValueState;
  (function(UsedValueState2) {
    UsedValueState2[UsedValueState2["Started"] = 0] = "Started";
    UsedValueState2[UsedValueState2["Completed"] = 1] = "Completed";
  })(UsedValueState || (exports.UsedValueState = UsedValueState = {}));
  exports.varKinds = {
    const: new code_1.Name("const"),
    let: new code_1.Name("let"),
    var: new code_1.Name("var")
  };

  class Scope {
    constructor({ prefixes, parent } = {}) {
      this._names = {};
      this._prefixes = prefixes;
      this._parent = parent;
    }
    toName(nameOrPrefix) {
      return nameOrPrefix instanceof code_1.Name ? nameOrPrefix : this.name(nameOrPrefix);
    }
    name(prefix) {
      return new code_1.Name(this._newName(prefix));
    }
    _newName(prefix) {
      const ng = this._names[prefix] || this._nameGroup(prefix);
      return `${prefix}${ng.index++}`;
    }
    _nameGroup(prefix) {
      var _a, _b;
      if (((_b = (_a = this._parent) === null || _a === undefined ? undefined : _a._prefixes) === null || _b === undefined ? undefined : _b.has(prefix)) || this._prefixes && !this._prefixes.has(prefix)) {
        throw new Error(`CodeGen: prefix "${prefix}" is not allowed in this scope`);
      }
      return this._names[prefix] = { prefix, index: 0 };
    }
  }
  exports.Scope = Scope;

  class ValueScopeName extends code_1.Name {
    constructor(prefix, nameStr) {
      super(nameStr);
      this.prefix = prefix;
    }
    setValue(value, { property, itemIndex }) {
      this.value = value;
      this.scopePath = (0, code_1._)`.${new code_1.Name(property)}[${itemIndex}]`;
    }
  }
  exports.ValueScopeName = ValueScopeName;
  var line = (0, code_1._)`\n`;

  class ValueScope extends Scope {
    constructor(opts) {
      super(opts);
      this._values = {};
      this._scope = opts.scope;
      this.opts = { ...opts, _n: opts.lines ? line : code_1.nil };
    }
    get() {
      return this._scope;
    }
    name(prefix) {
      return new ValueScopeName(prefix, this._newName(prefix));
    }
    value(nameOrPrefix, value) {
      var _a;
      if (value.ref === undefined)
        throw new Error("CodeGen: ref must be passed in value");
      const name = this.toName(nameOrPrefix);
      const { prefix } = name;
      const valueKey = (_a = value.key) !== null && _a !== undefined ? _a : value.ref;
      let vs = this._values[prefix];
      if (vs) {
        const _name = vs.get(valueKey);
        if (_name)
          return _name;
      } else {
        vs = this._values[prefix] = new Map;
      }
      vs.set(valueKey, name);
      const s = this._scope[prefix] || (this._scope[prefix] = []);
      const itemIndex = s.length;
      s[itemIndex] = value.ref;
      name.setValue(value, { property: prefix, itemIndex });
      return name;
    }
    getValue(prefix, keyOrRef) {
      const vs = this._values[prefix];
      if (!vs)
        return;
      return vs.get(keyOrRef);
    }
    scopeRefs(scopeName, values = this._values) {
      return this._reduceValues(values, (name) => {
        if (name.scopePath === undefined)
          throw new Error(`CodeGen: name "${name}" has no value`);
        return (0, code_1._)`${scopeName}${name.scopePath}`;
      });
    }
    scopeCode(values = this._values, usedValues, getCode) {
      return this._reduceValues(values, (name) => {
        if (name.value === undefined)
          throw new Error(`CodeGen: name "${name}" has no value`);
        return name.value.code;
      }, usedValues, getCode);
    }
    _reduceValues(values, valueCode, usedValues = {}, getCode) {
      let code = code_1.nil;
      for (const prefix in values) {
        const vs = values[prefix];
        if (!vs)
          continue;
        const nameSet = usedValues[prefix] = usedValues[prefix] || new Map;
        vs.forEach((name) => {
          if (nameSet.has(name))
            return;
          nameSet.set(name, UsedValueState.Started);
          let c = valueCode(name);
          if (c) {
            const def = this.opts.es5 ? exports.varKinds.var : exports.varKinds.const;
            code = (0, code_1._)`${code}${def} ${name} = ${c};${this.opts._n}`;
          } else if (c = getCode === null || getCode === undefined ? undefined : getCode(name)) {
            code = (0, code_1._)`${code}${c}${this.opts._n}`;
          } else {
            throw new ValueError(name);
          }
          nameSet.set(name, UsedValueState.Completed);
        });
      }
      return code;
    }
  }
  exports.ValueScope = ValueScope;
});

// node_modules/.pnpm/ajv@8.17.1/node_modules/ajv/dist/compile/codegen/index.js
var require_codegen = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.or = exports.and = exports.not = exports.CodeGen = exports.operators = exports.varKinds = exports.ValueScopeName = exports.ValueScope = exports.Scope = exports.Name = exports.regexpCode = exports.stringify = exports.getProperty = exports.nil = exports.strConcat = exports.str = exports._ = undefined;
  var code_1 = require_code();
  var scope_1 = require_scope();
  var code_2 = require_code();
  Object.defineProperty(exports, "_", { enumerable: true, get: function() {
    return code_2._;
  } });
  Object.defineProperty(exports, "str", { enumerable: true, get: function() {
    return code_2.str;
  } });
  Object.defineProperty(exports, "strConcat", { enumerable: true, get: function() {
    return code_2.strConcat;
  } });
  Object.defineProperty(exports, "nil", { enumerable: true, get: function() {
    return code_2.nil;
  } });
  Object.defineProperty(exports, "getProperty", { enumerable: true, get: function() {
    return code_2.getProperty;
  } });
  Object.defineProperty(exports, "stringify", { enumerable: true, get: function() {
    return code_2.stringify;
  } });
  Object.defineProperty(exports, "regexpCode", { enumerable: true, get: function() {
    return code_2.regexpCode;
  } });
  Object.defineProperty(exports, "Name", { enumerable: true, get: function() {
    return code_2.Name;
  } });
  var scope_2 = require_scope();
  Object.defineProperty(exports, "Scope", { enumerable: true, get: function() {
    return scope_2.Scope;
  } });
  Object.defineProperty(exports, "ValueScope", { enumerable: true, get: function() {
    return scope_2.ValueScope;
  } });
  Object.defineProperty(exports, "ValueScopeName", { enumerable: true, get: function() {
    return scope_2.ValueScopeName;
  } });
  Object.defineProperty(exports, "varKinds", { enumerable: true, get: function() {
    return scope_2.varKinds;
  } });
  exports.operators = {
    GT: new code_1._Code(">"),
    GTE: new code_1._Code(">="),
    LT: new code_1._Code("<"),
    LTE: new code_1._Code("<="),
    EQ: new code_1._Code("==="),
    NEQ: new code_1._Code("!=="),
    NOT: new code_1._Code("!"),
    OR: new code_1._Code("||"),
    AND: new code_1._Code("&&"),
    ADD: new code_1._Code("+")
  };

  class Node {
    optimizeNodes() {
      return this;
    }
    optimizeNames(_names, _constants) {
      return this;
    }
  }

  class Def extends Node {
    constructor(varKind, name, rhs) {
      super();
      this.varKind = varKind;
      this.name = name;
      this.rhs = rhs;
    }
    render({ es5, _n }) {
      const varKind = es5 ? scope_1.varKinds.var : this.varKind;
      const rhs = this.rhs === undefined ? "" : ` = ${this.rhs}`;
      return `${varKind} ${this.name}${rhs};` + _n;
    }
    optimizeNames(names, constants) {
      if (!names[this.name.str])
        return;
      if (this.rhs)
        this.rhs = optimizeExpr(this.rhs, names, constants);
      return this;
    }
    get names() {
      return this.rhs instanceof code_1._CodeOrName ? this.rhs.names : {};
    }
  }

  class Assign extends Node {
    constructor(lhs, rhs, sideEffects) {
      super();
      this.lhs = lhs;
      this.rhs = rhs;
      this.sideEffects = sideEffects;
    }
    render({ _n }) {
      return `${this.lhs} = ${this.rhs};` + _n;
    }
    optimizeNames(names, constants) {
      if (this.lhs instanceof code_1.Name && !names[this.lhs.str] && !this.sideEffects)
        return;
      this.rhs = optimizeExpr(this.rhs, names, constants);
      return this;
    }
    get names() {
      const names = this.lhs instanceof code_1.Name ? {} : { ...this.lhs.names };
      return addExprNames(names, this.rhs);
    }
  }

  class AssignOp extends Assign {
    constructor(lhs, op, rhs, sideEffects) {
      super(lhs, rhs, sideEffects);
      this.op = op;
    }
    render({ _n }) {
      return `${this.lhs} ${this.op}= ${this.rhs};` + _n;
    }
  }

  class Label extends Node {
    constructor(label) {
      super();
      this.label = label;
      this.names = {};
    }
    render({ _n }) {
      return `${this.label}:` + _n;
    }
  }

  class Break extends Node {
    constructor(label) {
      super();
      this.label = label;
      this.names = {};
    }
    render({ _n }) {
      const label = this.label ? ` ${this.label}` : "";
      return `break${label};` + _n;
    }
  }

  class Throw extends Node {
    constructor(error) {
      super();
      this.error = error;
    }
    render({ _n }) {
      return `throw ${this.error};` + _n;
    }
    get names() {
      return this.error.names;
    }
  }

  class AnyCode extends Node {
    constructor(code) {
      super();
      this.code = code;
    }
    render({ _n }) {
      return `${this.code};` + _n;
    }
    optimizeNodes() {
      return `${this.code}` ? this : undefined;
    }
    optimizeNames(names, constants) {
      this.code = optimizeExpr(this.code, names, constants);
      return this;
    }
    get names() {
      return this.code instanceof code_1._CodeOrName ? this.code.names : {};
    }
  }

  class ParentNode extends Node {
    constructor(nodes = []) {
      super();
      this.nodes = nodes;
    }
    render(opts) {
      return this.nodes.reduce((code, n) => code + n.render(opts), "");
    }
    optimizeNodes() {
      const { nodes } = this;
      let i = nodes.length;
      while (i--) {
        const n = nodes[i].optimizeNodes();
        if (Array.isArray(n))
          nodes.splice(i, 1, ...n);
        else if (n)
          nodes[i] = n;
        else
          nodes.splice(i, 1);
      }
      return nodes.length > 0 ? this : undefined;
    }
    optimizeNames(names, constants) {
      const { nodes } = this;
      let i = nodes.length;
      while (i--) {
        const n = nodes[i];
        if (n.optimizeNames(names, constants))
          continue;
        subtractNames(names, n.names);
        nodes.splice(i, 1);
      }
      return nodes.length > 0 ? this : undefined;
    }
    get names() {
      return this.nodes.reduce((names, n) => addNames(names, n.names), {});
    }
  }

  class BlockNode extends ParentNode {
    render(opts) {
      return "{" + opts._n + super.render(opts) + "}" + opts._n;
    }
  }

  class Root extends ParentNode {
  }

  class Else extends BlockNode {
  }
  Else.kind = "else";

  class If extends BlockNode {
    constructor(condition, nodes) {
      super(nodes);
      this.condition = condition;
    }
    render(opts) {
      let code = `if(${this.condition})` + super.render(opts);
      if (this.else)
        code += "else " + this.else.render(opts);
      return code;
    }
    optimizeNodes() {
      super.optimizeNodes();
      const cond = this.condition;
      if (cond === true)
        return this.nodes;
      let e = this.else;
      if (e) {
        const ns = e.optimizeNodes();
        e = this.else = Array.isArray(ns) ? new Else(ns) : ns;
      }
      if (e) {
        if (cond === false)
          return e instanceof If ? e : e.nodes;
        if (this.nodes.length)
          return this;
        return new If(not(cond), e instanceof If ? [e] : e.nodes);
      }
      if (cond === false || !this.nodes.length)
        return;
      return this;
    }
    optimizeNames(names, constants) {
      var _a;
      this.else = (_a = this.else) === null || _a === undefined ? undefined : _a.optimizeNames(names, constants);
      if (!(super.optimizeNames(names, constants) || this.else))
        return;
      this.condition = optimizeExpr(this.condition, names, constants);
      return this;
    }
    get names() {
      const names = super.names;
      addExprNames(names, this.condition);
      if (this.else)
        addNames(names, this.else.names);
      return names;
    }
  }
  If.kind = "if";

  class For extends BlockNode {
  }
  For.kind = "for";

  class ForLoop extends For {
    constructor(iteration) {
      super();
      this.iteration = iteration;
    }
    render(opts) {
      return `for(${this.iteration})` + super.render(opts);
    }
    optimizeNames(names, constants) {
      if (!super.optimizeNames(names, constants))
        return;
      this.iteration = optimizeExpr(this.iteration, names, constants);
      return this;
    }
    get names() {
      return addNames(super.names, this.iteration.names);
    }
  }

  class ForRange extends For {
    constructor(varKind, name, from, to) {
      super();
      this.varKind = varKind;
      this.name = name;
      this.from = from;
      this.to = to;
    }
    render(opts) {
      const varKind = opts.es5 ? scope_1.varKinds.var : this.varKind;
      const { name, from, to } = this;
      return `for(${varKind} ${name}=${from}; ${name}<${to}; ${name}++)` + super.render(opts);
    }
    get names() {
      const names = addExprNames(super.names, this.from);
      return addExprNames(names, this.to);
    }
  }

  class ForIter extends For {
    constructor(loop, varKind, name, iterable) {
      super();
      this.loop = loop;
      this.varKind = varKind;
      this.name = name;
      this.iterable = iterable;
    }
    render(opts) {
      return `for(${this.varKind} ${this.name} ${this.loop} ${this.iterable})` + super.render(opts);
    }
    optimizeNames(names, constants) {
      if (!super.optimizeNames(names, constants))
        return;
      this.iterable = optimizeExpr(this.iterable, names, constants);
      return this;
    }
    get names() {
      return addNames(super.names, this.iterable.names);
    }
  }

  class Func extends BlockNode {
    constructor(name, args, async) {
      super();
      this.name = name;
      this.args = args;
      this.async = async;
    }
    render(opts) {
      const _async = this.async ? "async " : "";
      return `${_async}function ${this.name}(${this.args})` + super.render(opts);
    }
  }
  Func.kind = "func";

  class Return extends ParentNode {
    render(opts) {
      return "return " + super.render(opts);
    }
  }
  Return.kind = "return";

  class Try extends BlockNode {
    render(opts) {
      let code = "try" + super.render(opts);
      if (this.catch)
        code += this.catch.render(opts);
      if (this.finally)
        code += this.finally.render(opts);
      return code;
    }
    optimizeNodes() {
      var _a, _b;
      super.optimizeNodes();
      (_a = this.catch) === null || _a === undefined || _a.optimizeNodes();
      (_b = this.finally) === null || _b === undefined || _b.optimizeNodes();
      return this;
    }
    optimizeNames(names, constants) {
      var _a, _b;
      super.optimizeNames(names, constants);
      (_a = this.catch) === null || _a === undefined || _a.optimizeNames(names, constants);
      (_b = this.finally) === null || _b === undefined || _b.optimizeNames(names, constants);
      return this;
    }
    get names() {
      const names = super.names;
      if (this.catch)
        addNames(names, this.catch.names);
      if (this.finally)
        addNames(names, this.finally.names);
      return names;
    }
  }

  class Catch extends BlockNode {
    constructor(error) {
      super();
      this.error = error;
    }
    render(opts) {
      return `catch(${this.error})` + super.render(opts);
    }
  }
  Catch.kind = "catch";

  class Finally extends BlockNode {
    render(opts) {
      return "finally" + super.render(opts);
    }
  }
  Finally.kind = "finally";

  class CodeGen {
    constructor(extScope, opts = {}) {
      this._values = {};
      this._blockStarts = [];
      this._constants = {};
      this.opts = { ...opts, _n: opts.lines ? `
` : "" };
      this._extScope = extScope;
      this._scope = new scope_1.Scope({ parent: extScope });
      this._nodes = [new Root];
    }
    toString() {
      return this._root.render(this.opts);
    }
    name(prefix) {
      return this._scope.name(prefix);
    }
    scopeName(prefix) {
      return this._extScope.name(prefix);
    }
    scopeValue(prefixOrName, value) {
      const name = this._extScope.value(prefixOrName, value);
      const vs = this._values[name.prefix] || (this._values[name.prefix] = new Set);
      vs.add(name);
      return name;
    }
    getScopeValue(prefix, keyOrRef) {
      return this._extScope.getValue(prefix, keyOrRef);
    }
    scopeRefs(scopeName) {
      return this._extScope.scopeRefs(scopeName, this._values);
    }
    scopeCode() {
      return this._extScope.scopeCode(this._values);
    }
    _def(varKind, nameOrPrefix, rhs, constant) {
      const name = this._scope.toName(nameOrPrefix);
      if (rhs !== undefined && constant)
        this._constants[name.str] = rhs;
      this._leafNode(new Def(varKind, name, rhs));
      return name;
    }
    const(nameOrPrefix, rhs, _constant) {
      return this._def(scope_1.varKinds.const, nameOrPrefix, rhs, _constant);
    }
    let(nameOrPrefix, rhs, _constant) {
      return this._def(scope_1.varKinds.let, nameOrPrefix, rhs, _constant);
    }
    var(nameOrPrefix, rhs, _constant) {
      return this._def(scope_1.varKinds.var, nameOrPrefix, rhs, _constant);
    }
    assign(lhs, rhs, sideEffects) {
      return this._leafNode(new Assign(lhs, rhs, sideEffects));
    }
    add(lhs, rhs) {
      return this._leafNode(new AssignOp(lhs, exports.operators.ADD, rhs));
    }
    code(c) {
      if (typeof c == "function")
        c();
      else if (c !== code_1.nil)
        this._leafNode(new AnyCode(c));
      return this;
    }
    object(...keyValues) {
      const code = ["{"];
      for (const [key, value] of keyValues) {
        if (code.length > 1)
          code.push(",");
        code.push(key);
        if (key !== value || this.opts.es5) {
          code.push(":");
          (0, code_1.addCodeArg)(code, value);
        }
      }
      code.push("}");
      return new code_1._Code(code);
    }
    if(condition, thenBody, elseBody) {
      this._blockNode(new If(condition));
      if (thenBody && elseBody) {
        this.code(thenBody).else().code(elseBody).endIf();
      } else if (thenBody) {
        this.code(thenBody).endIf();
      } else if (elseBody) {
        throw new Error('CodeGen: "else" body without "then" body');
      }
      return this;
    }
    elseIf(condition) {
      return this._elseNode(new If(condition));
    }
    else() {
      return this._elseNode(new Else);
    }
    endIf() {
      return this._endBlockNode(If, Else);
    }
    _for(node, forBody) {
      this._blockNode(node);
      if (forBody)
        this.code(forBody).endFor();
      return this;
    }
    for(iteration, forBody) {
      return this._for(new ForLoop(iteration), forBody);
    }
    forRange(nameOrPrefix, from, to, forBody, varKind = this.opts.es5 ? scope_1.varKinds.var : scope_1.varKinds.let) {
      const name = this._scope.toName(nameOrPrefix);
      return this._for(new ForRange(varKind, name, from, to), () => forBody(name));
    }
    forOf(nameOrPrefix, iterable, forBody, varKind = scope_1.varKinds.const) {
      const name = this._scope.toName(nameOrPrefix);
      if (this.opts.es5) {
        const arr = iterable instanceof code_1.Name ? iterable : this.var("_arr", iterable);
        return this.forRange("_i", 0, (0, code_1._)`${arr}.length`, (i) => {
          this.var(name, (0, code_1._)`${arr}[${i}]`);
          forBody(name);
        });
      }
      return this._for(new ForIter("of", varKind, name, iterable), () => forBody(name));
    }
    forIn(nameOrPrefix, obj, forBody, varKind = this.opts.es5 ? scope_1.varKinds.var : scope_1.varKinds.const) {
      if (this.opts.ownProperties) {
        return this.forOf(nameOrPrefix, (0, code_1._)`Object.keys(${obj})`, forBody);
      }
      const name = this._scope.toName(nameOrPrefix);
      return this._for(new ForIter("in", varKind, name, obj), () => forBody(name));
    }
    endFor() {
      return this._endBlockNode(For);
    }
    label(label) {
      return this._leafNode(new Label(label));
    }
    break(label) {
      return this._leafNode(new Break(label));
    }
    return(value) {
      const node = new Return;
      this._blockNode(node);
      this.code(value);
      if (node.nodes.length !== 1)
        throw new Error('CodeGen: "return" should have one node');
      return this._endBlockNode(Return);
    }
    try(tryBody, catchCode, finallyCode) {
      if (!catchCode && !finallyCode)
        throw new Error('CodeGen: "try" without "catch" and "finally"');
      const node = new Try;
      this._blockNode(node);
      this.code(tryBody);
      if (catchCode) {
        const error = this.name("e");
        this._currNode = node.catch = new Catch(error);
        catchCode(error);
      }
      if (finallyCode) {
        this._currNode = node.finally = new Finally;
        this.code(finallyCode);
      }
      return this._endBlockNode(Catch, Finally);
    }
    throw(error) {
      return this._leafNode(new Throw(error));
    }
    block(body, nodeCount) {
      this._blockStarts.push(this._nodes.length);
      if (body)
        this.code(body).endBlock(nodeCount);
      return this;
    }
    endBlock(nodeCount) {
      const len = this._blockStarts.pop();
      if (len === undefined)
        throw new Error("CodeGen: not in self-balancing block");
      const toClose = this._nodes.length - len;
      if (toClose < 0 || nodeCount !== undefined && toClose !== nodeCount) {
        throw new Error(`CodeGen: wrong number of nodes: ${toClose} vs ${nodeCount} expected`);
      }
      this._nodes.length = len;
      return this;
    }
    func(name, args = code_1.nil, async, funcBody) {
      this._blockNode(new Func(name, args, async));
      if (funcBody)
        this.code(funcBody).endFunc();
      return this;
    }
    endFunc() {
      return this._endBlockNode(Func);
    }
    optimize(n = 1) {
      while (n-- > 0) {
        this._root.optimizeNodes();
        this._root.optimizeNames(this._root.names, this._constants);
      }
    }
    _leafNode(node) {
      this._currNode.nodes.push(node);
      return this;
    }
    _blockNode(node) {
      this._currNode.nodes.push(node);
      this._nodes.push(node);
    }
    _endBlockNode(N1, N2) {
      const n = this._currNode;
      if (n instanceof N1 || N2 && n instanceof N2) {
        this._nodes.pop();
        return this;
      }
      throw new Error(`CodeGen: not in block "${N2 ? `${N1.kind}/${N2.kind}` : N1.kind}"`);
    }
    _elseNode(node) {
      const n = this._currNode;
      if (!(n instanceof If)) {
        throw new Error('CodeGen: "else" without "if"');
      }
      this._currNode = n.else = node;
      return this;
    }
    get _root() {
      return this._nodes[0];
    }
    get _currNode() {
      const ns = this._nodes;
      return ns[ns.length - 1];
    }
    set _currNode(node) {
      const ns = this._nodes;
      ns[ns.length - 1] = node;
    }
  }
  exports.CodeGen = CodeGen;
  function addNames(names, from) {
    for (const n in from)
      names[n] = (names[n] || 0) + (from[n] || 0);
    return names;
  }
  function addExprNames(names, from) {
    return from instanceof code_1._CodeOrName ? addNames(names, from.names) : names;
  }
  function optimizeExpr(expr, names, constants) {
    if (expr instanceof code_1.Name)
      return replaceName(expr);
    if (!canOptimize(expr))
      return expr;
    return new code_1._Code(expr._items.reduce((items, c) => {
      if (c instanceof code_1.Name)
        c = replaceName(c);
      if (c instanceof code_1._Code)
        items.push(...c._items);
      else
        items.push(c);
      return items;
    }, []));
    function replaceName(n) {
      const c = constants[n.str];
      if (c === undefined || names[n.str] !== 1)
        return n;
      delete names[n.str];
      return c;
    }
    function canOptimize(e) {
      return e instanceof code_1._Code && e._items.some((c) => c instanceof code_1.Name && names[c.str] === 1 && constants[c.str] !== undefined);
    }
  }
  function subtractNames(names, from) {
    for (const n in from)
      names[n] = (names[n] || 0) - (from[n] || 0);
  }
  function not(x) {
    return typeof x == "boolean" || typeof x == "number" || x === null ? !x : (0, code_1._)`!${par(x)}`;
  }
  exports.not = not;
  var andCode = mappend(exports.operators.AND);
  function and(...args) {
    return args.reduce(andCode);
  }
  exports.and = and;
  var orCode = mappend(exports.operators.OR);
  function or(...args) {
    return args.reduce(orCode);
  }
  exports.or = or;
  function mappend(op) {
    return (x, y) => x === code_1.nil ? y : y === code_1.nil ? x : (0, code_1._)`${par(x)} ${op} ${par(y)}`;
  }
  function par(x) {
    return x instanceof code_1.Name ? x : (0, code_1._)`(${x})`;
  }
});

// node_modules/.pnpm/ajv@8.17.1/node_modules/ajv/dist/compile/util.js
var require_util = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.checkStrictMode = exports.getErrorPath = exports.Type = exports.useFunc = exports.setEvaluated = exports.evaluatedPropsToName = exports.mergeEvaluated = exports.eachItem = exports.unescapeJsonPointer = exports.escapeJsonPointer = exports.escapeFragment = exports.unescapeFragment = exports.schemaRefOrVal = exports.schemaHasRulesButRef = exports.schemaHasRules = exports.checkUnknownRules = exports.alwaysValidSchema = exports.toHash = undefined;
  var codegen_1 = require_codegen();
  var code_1 = require_code();
  function toHash(arr) {
    const hash = {};
    for (const item of arr)
      hash[item] = true;
    return hash;
  }
  exports.toHash = toHash;
  function alwaysValidSchema(it, schema) {
    if (typeof schema == "boolean")
      return schema;
    if (Object.keys(schema).length === 0)
      return true;
    checkUnknownRules(it, schema);
    return !schemaHasRules(schema, it.self.RULES.all);
  }
  exports.alwaysValidSchema = alwaysValidSchema;
  function checkUnknownRules(it, schema = it.schema) {
    const { opts, self } = it;
    if (!opts.strictSchema)
      return;
    if (typeof schema === "boolean")
      return;
    const rules = self.RULES.keywords;
    for (const key in schema) {
      if (!rules[key])
        checkStrictMode(it, `unknown keyword: "${key}"`);
    }
  }
  exports.checkUnknownRules = checkUnknownRules;
  function schemaHasRules(schema, rules) {
    if (typeof schema == "boolean")
      return !schema;
    for (const key in schema)
      if (rules[key])
        return true;
    return false;
  }
  exports.schemaHasRules = schemaHasRules;
  function schemaHasRulesButRef(schema, RULES) {
    if (typeof schema == "boolean")
      return !schema;
    for (const key in schema)
      if (key !== "$ref" && RULES.all[key])
        return true;
    return false;
  }
  exports.schemaHasRulesButRef = schemaHasRulesButRef;
  function schemaRefOrVal({ topSchemaRef, schemaPath }, schema, keyword, $data) {
    if (!$data) {
      if (typeof schema == "number" || typeof schema == "boolean")
        return schema;
      if (typeof schema == "string")
        return (0, codegen_1._)`${schema}`;
    }
    return (0, codegen_1._)`${topSchemaRef}${schemaPath}${(0, codegen_1.getProperty)(keyword)}`;
  }
  exports.schemaRefOrVal = schemaRefOrVal;
  function unescapeFragment(str) {
    return unescapeJsonPointer(decodeURIComponent(str));
  }
  exports.unescapeFragment = unescapeFragment;
  function escapeFragment(str) {
    return encodeURIComponent(escapeJsonPointer(str));
  }
  exports.escapeFragment = escapeFragment;
  function escapeJsonPointer(str) {
    if (typeof str == "number")
      return `${str}`;
    return str.replace(/~/g, "~0").replace(/\//g, "~1");
  }
  exports.escapeJsonPointer = escapeJsonPointer;
  function unescapeJsonPointer(str) {
    return str.replace(/~1/g, "/").replace(/~0/g, "~");
  }
  exports.unescapeJsonPointer = unescapeJsonPointer;
  function eachItem(xs, f) {
    if (Array.isArray(xs)) {
      for (const x of xs)
        f(x);
    } else {
      f(xs);
    }
  }
  exports.eachItem = eachItem;
  function makeMergeEvaluated({ mergeNames, mergeToName, mergeValues, resultToName }) {
    return (gen, from, to, toName) => {
      const res = to === undefined ? from : to instanceof codegen_1.Name ? (from instanceof codegen_1.Name ? mergeNames(gen, from, to) : mergeToName(gen, from, to), to) : from instanceof codegen_1.Name ? (mergeToName(gen, to, from), from) : mergeValues(from, to);
      return toName === codegen_1.Name && !(res instanceof codegen_1.Name) ? resultToName(gen, res) : res;
    };
  }
  exports.mergeEvaluated = {
    props: makeMergeEvaluated({
      mergeNames: (gen, from, to) => gen.if((0, codegen_1._)`${to} !== true && ${from} !== undefined`, () => {
        gen.if((0, codegen_1._)`${from} === true`, () => gen.assign(to, true), () => gen.assign(to, (0, codegen_1._)`${to} || {}`).code((0, codegen_1._)`Object.assign(${to}, ${from})`));
      }),
      mergeToName: (gen, from, to) => gen.if((0, codegen_1._)`${to} !== true`, () => {
        if (from === true) {
          gen.assign(to, true);
        } else {
          gen.assign(to, (0, codegen_1._)`${to} || {}`);
          setEvaluated(gen, to, from);
        }
      }),
      mergeValues: (from, to) => from === true ? true : { ...from, ...to },
      resultToName: evaluatedPropsToName
    }),
    items: makeMergeEvaluated({
      mergeNames: (gen, from, to) => gen.if((0, codegen_1._)`${to} !== true && ${from} !== undefined`, () => gen.assign(to, (0, codegen_1._)`${from} === true ? true : ${to} > ${from} ? ${to} : ${from}`)),
      mergeToName: (gen, from, to) => gen.if((0, codegen_1._)`${to} !== true`, () => gen.assign(to, from === true ? true : (0, codegen_1._)`${to} > ${from} ? ${to} : ${from}`)),
      mergeValues: (from, to) => from === true ? true : Math.max(from, to),
      resultToName: (gen, items) => gen.var("items", items)
    })
  };
  function evaluatedPropsToName(gen, ps) {
    if (ps === true)
      return gen.var("props", true);
    const props = gen.var("props", (0, codegen_1._)`{}`);
    if (ps !== undefined)
      setEvaluated(gen, props, ps);
    return props;
  }
  exports.evaluatedPropsToName = evaluatedPropsToName;
  function setEvaluated(gen, props, ps) {
    Object.keys(ps).forEach((p) => gen.assign((0, codegen_1._)`${props}${(0, codegen_1.getProperty)(p)}`, true));
  }
  exports.setEvaluated = setEvaluated;
  var snippets = {};
  function useFunc(gen, f) {
    return gen.scopeValue("func", {
      ref: f,
      code: snippets[f.code] || (snippets[f.code] = new code_1._Code(f.code))
    });
  }
  exports.useFunc = useFunc;
  var Type;
  (function(Type2) {
    Type2[Type2["Num"] = 0] = "Num";
    Type2[Type2["Str"] = 1] = "Str";
  })(Type || (exports.Type = Type = {}));
  function getErrorPath(dataProp, dataPropType, jsPropertySyntax) {
    if (dataProp instanceof codegen_1.Name) {
      const isNumber = dataPropType === Type.Num;
      return jsPropertySyntax ? isNumber ? (0, codegen_1._)`"[" + ${dataProp} + "]"` : (0, codegen_1._)`"['" + ${dataProp} + "']"` : isNumber ? (0, codegen_1._)`"/" + ${dataProp}` : (0, codegen_1._)`"/" + ${dataProp}.replace(/~/g, "~0").replace(/\\//g, "~1")`;
    }
    return jsPropertySyntax ? (0, codegen_1.getProperty)(dataProp).toString() : "/" + escapeJsonPointer(dataProp);
  }
  exports.getErrorPath = getErrorPath;
  function checkStrictMode(it, msg, mode = it.opts.strictSchema) {
    if (!mode)
      return;
    msg = `strict mode: ${msg}`;
    if (mode === true)
      throw new Error(msg);
    it.self.logger.warn(msg);
  }
  exports.checkStrictMode = checkStrictMode;
});

// node_modules/.pnpm/ajv@8.17.1/node_modules/ajv/dist/compile/names.js
var require_names = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var codegen_1 = require_codegen();
  var names = {
    data: new codegen_1.Name("data"),
    valCxt: new codegen_1.Name("valCxt"),
    instancePath: new codegen_1.Name("instancePath"),
    parentData: new codegen_1.Name("parentData"),
    parentDataProperty: new codegen_1.Name("parentDataProperty"),
    rootData: new codegen_1.Name("rootData"),
    dynamicAnchors: new codegen_1.Name("dynamicAnchors"),
    vErrors: new codegen_1.Name("vErrors"),
    errors: new codegen_1.Name("errors"),
    this: new codegen_1.Name("this"),
    self: new codegen_1.Name("self"),
    scope: new codegen_1.Name("scope"),
    json: new codegen_1.Name("json"),
    jsonPos: new codegen_1.Name("jsonPos"),
    jsonLen: new codegen_1.Name("jsonLen"),
    jsonPart: new codegen_1.Name("jsonPart")
  };
  exports.default = names;
});

// node_modules/.pnpm/ajv@8.17.1/node_modules/ajv/dist/compile/errors.js
var require_errors = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.extendErrors = exports.resetErrorsCount = exports.reportExtraError = exports.reportError = exports.keyword$DataError = exports.keywordError = undefined;
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  var names_1 = require_names();
  exports.keywordError = {
    message: ({ keyword }) => (0, codegen_1.str)`must pass "${keyword}" keyword validation`
  };
  exports.keyword$DataError = {
    message: ({ keyword, schemaType }) => schemaType ? (0, codegen_1.str)`"${keyword}" keyword must be ${schemaType} ($data)` : (0, codegen_1.str)`"${keyword}" keyword is invalid ($data)`
  };
  function reportError(cxt, error = exports.keywordError, errorPaths, overrideAllErrors) {
    const { it } = cxt;
    const { gen, compositeRule, allErrors } = it;
    const errObj = errorObjectCode(cxt, error, errorPaths);
    if (overrideAllErrors !== null && overrideAllErrors !== undefined ? overrideAllErrors : compositeRule || allErrors) {
      addError(gen, errObj);
    } else {
      returnErrors(it, (0, codegen_1._)`[${errObj}]`);
    }
  }
  exports.reportError = reportError;
  function reportExtraError(cxt, error = exports.keywordError, errorPaths) {
    const { it } = cxt;
    const { gen, compositeRule, allErrors } = it;
    const errObj = errorObjectCode(cxt, error, errorPaths);
    addError(gen, errObj);
    if (!(compositeRule || allErrors)) {
      returnErrors(it, names_1.default.vErrors);
    }
  }
  exports.reportExtraError = reportExtraError;
  function resetErrorsCount(gen, errsCount) {
    gen.assign(names_1.default.errors, errsCount);
    gen.if((0, codegen_1._)`${names_1.default.vErrors} !== null`, () => gen.if(errsCount, () => gen.assign((0, codegen_1._)`${names_1.default.vErrors}.length`, errsCount), () => gen.assign(names_1.default.vErrors, null)));
  }
  exports.resetErrorsCount = resetErrorsCount;
  function extendErrors({ gen, keyword, schemaValue, data, errsCount, it }) {
    if (errsCount === undefined)
      throw new Error("ajv implementation error");
    const err = gen.name("err");
    gen.forRange("i", errsCount, names_1.default.errors, (i) => {
      gen.const(err, (0, codegen_1._)`${names_1.default.vErrors}[${i}]`);
      gen.if((0, codegen_1._)`${err}.instancePath === undefined`, () => gen.assign((0, codegen_1._)`${err}.instancePath`, (0, codegen_1.strConcat)(names_1.default.instancePath, it.errorPath)));
      gen.assign((0, codegen_1._)`${err}.schemaPath`, (0, codegen_1.str)`${it.errSchemaPath}/${keyword}`);
      if (it.opts.verbose) {
        gen.assign((0, codegen_1._)`${err}.schema`, schemaValue);
        gen.assign((0, codegen_1._)`${err}.data`, data);
      }
    });
  }
  exports.extendErrors = extendErrors;
  function addError(gen, errObj) {
    const err = gen.const("err", errObj);
    gen.if((0, codegen_1._)`${names_1.default.vErrors} === null`, () => gen.assign(names_1.default.vErrors, (0, codegen_1._)`[${err}]`), (0, codegen_1._)`${names_1.default.vErrors}.push(${err})`);
    gen.code((0, codegen_1._)`${names_1.default.errors}++`);
  }
  function returnErrors(it, errs) {
    const { gen, validateName, schemaEnv } = it;
    if (schemaEnv.$async) {
      gen.throw((0, codegen_1._)`new ${it.ValidationError}(${errs})`);
    } else {
      gen.assign((0, codegen_1._)`${validateName}.errors`, errs);
      gen.return(false);
    }
  }
  var E = {
    keyword: new codegen_1.Name("keyword"),
    schemaPath: new codegen_1.Name("schemaPath"),
    params: new codegen_1.Name("params"),
    propertyName: new codegen_1.Name("propertyName"),
    message: new codegen_1.Name("message"),
    schema: new codegen_1.Name("schema"),
    parentSchema: new codegen_1.Name("parentSchema")
  };
  function errorObjectCode(cxt, error, errorPaths) {
    const { createErrors } = cxt.it;
    if (createErrors === false)
      return (0, codegen_1._)`{}`;
    return errorObject(cxt, error, errorPaths);
  }
  function errorObject(cxt, error, errorPaths = {}) {
    const { gen, it } = cxt;
    const keyValues = [
      errorInstancePath(it, errorPaths),
      errorSchemaPath(cxt, errorPaths)
    ];
    extraErrorProps(cxt, error, keyValues);
    return gen.object(...keyValues);
  }
  function errorInstancePath({ errorPath }, { instancePath }) {
    const instPath = instancePath ? (0, codegen_1.str)`${errorPath}${(0, util_1.getErrorPath)(instancePath, util_1.Type.Str)}` : errorPath;
    return [names_1.default.instancePath, (0, codegen_1.strConcat)(names_1.default.instancePath, instPath)];
  }
  function errorSchemaPath({ keyword, it: { errSchemaPath } }, { schemaPath, parentSchema }) {
    let schPath = parentSchema ? errSchemaPath : (0, codegen_1.str)`${errSchemaPath}/${keyword}`;
    if (schemaPath) {
      schPath = (0, codegen_1.str)`${schPath}${(0, util_1.getErrorPath)(schemaPath, util_1.Type.Str)}`;
    }
    return [E.schemaPath, schPath];
  }
  function extraErrorProps(cxt, { params, message }, keyValues) {
    const { keyword, data, schemaValue, it } = cxt;
    const { opts, propertyName, topSchemaRef, schemaPath } = it;
    keyValues.push([E.keyword, keyword], [E.params, typeof params == "function" ? params(cxt) : params || (0, codegen_1._)`{}`]);
    if (opts.messages) {
      keyValues.push([E.message, typeof message == "function" ? message(cxt) : message]);
    }
    if (opts.verbose) {
      keyValues.push([E.schema, schemaValue], [E.parentSchema, (0, codegen_1._)`${topSchemaRef}${schemaPath}`], [names_1.default.data, data]);
    }
    if (propertyName)
      keyValues.push([E.propertyName, propertyName]);
  }
});

// node_modules/.pnpm/ajv@8.17.1/node_modules/ajv/dist/compile/validate/boolSchema.js
var require_boolSchema = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.boolOrEmptySchema = exports.topBoolOrEmptySchema = undefined;
  var errors_1 = require_errors();
  var codegen_1 = require_codegen();
  var names_1 = require_names();
  var boolError = {
    message: "boolean schema is false"
  };
  function topBoolOrEmptySchema(it) {
    const { gen, schema, validateName } = it;
    if (schema === false) {
      falseSchemaError(it, false);
    } else if (typeof schema == "object" && schema.$async === true) {
      gen.return(names_1.default.data);
    } else {
      gen.assign((0, codegen_1._)`${validateName}.errors`, null);
      gen.return(true);
    }
  }
  exports.topBoolOrEmptySchema = topBoolOrEmptySchema;
  function boolOrEmptySchema(it, valid) {
    const { gen, schema } = it;
    if (schema === false) {
      gen.var(valid, false);
      falseSchemaError(it);
    } else {
      gen.var(valid, true);
    }
  }
  exports.boolOrEmptySchema = boolOrEmptySchema;
  function falseSchemaError(it, overrideAllErrors) {
    const { gen, data } = it;
    const cxt = {
      gen,
      keyword: "false schema",
      data,
      schema: false,
      schemaCode: false,
      schemaValue: false,
      params: {},
      it
    };
    (0, errors_1.reportError)(cxt, boolError, undefined, overrideAllErrors);
  }
});

// node_modules/.pnpm/ajv@8.17.1/node_modules/ajv/dist/compile/rules.js
var require_rules = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.getRules = exports.isJSONType = undefined;
  var _jsonTypes = ["string", "number", "integer", "boolean", "null", "object", "array"];
  var jsonTypes = new Set(_jsonTypes);
  function isJSONType(x) {
    return typeof x == "string" && jsonTypes.has(x);
  }
  exports.isJSONType = isJSONType;
  function getRules() {
    const groups = {
      number: { type: "number", rules: [] },
      string: { type: "string", rules: [] },
      array: { type: "array", rules: [] },
      object: { type: "object", rules: [] }
    };
    return {
      types: { ...groups, integer: true, boolean: true, null: true },
      rules: [{ rules: [] }, groups.number, groups.string, groups.array, groups.object],
      post: { rules: [] },
      all: {},
      keywords: {}
    };
  }
  exports.getRules = getRules;
});

// node_modules/.pnpm/ajv@8.17.1/node_modules/ajv/dist/compile/validate/applicability.js
var require_applicability = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.shouldUseRule = exports.shouldUseGroup = exports.schemaHasRulesForType = undefined;
  function schemaHasRulesForType({ schema, self }, type) {
    const group = self.RULES.types[type];
    return group && group !== true && shouldUseGroup(schema, group);
  }
  exports.schemaHasRulesForType = schemaHasRulesForType;
  function shouldUseGroup(schema, group) {
    return group.rules.some((rule) => shouldUseRule(schema, rule));
  }
  exports.shouldUseGroup = shouldUseGroup;
  function shouldUseRule(schema, rule) {
    var _a;
    return schema[rule.keyword] !== undefined || ((_a = rule.definition.implements) === null || _a === undefined ? undefined : _a.some((kwd) => schema[kwd] !== undefined));
  }
  exports.shouldUseRule = shouldUseRule;
});

// node_modules/.pnpm/ajv@8.17.1/node_modules/ajv/dist/compile/validate/dataType.js
var require_dataType = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.reportTypeError = exports.checkDataTypes = exports.checkDataType = exports.coerceAndCheckDataType = exports.getJSONTypes = exports.getSchemaTypes = exports.DataType = undefined;
  var rules_1 = require_rules();
  var applicability_1 = require_applicability();
  var errors_1 = require_errors();
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  var DataType;
  (function(DataType2) {
    DataType2[DataType2["Correct"] = 0] = "Correct";
    DataType2[DataType2["Wrong"] = 1] = "Wrong";
  })(DataType || (exports.DataType = DataType = {}));
  function getSchemaTypes(schema) {
    const types = getJSONTypes(schema.type);
    const hasNull = types.includes("null");
    if (hasNull) {
      if (schema.nullable === false)
        throw new Error("type: null contradicts nullable: false");
    } else {
      if (!types.length && schema.nullable !== undefined) {
        throw new Error('"nullable" cannot be used without "type"');
      }
      if (schema.nullable === true)
        types.push("null");
    }
    return types;
  }
  exports.getSchemaTypes = getSchemaTypes;
  function getJSONTypes(ts) {
    const types = Array.isArray(ts) ? ts : ts ? [ts] : [];
    if (types.every(rules_1.isJSONType))
      return types;
    throw new Error("type must be JSONType or JSONType[]: " + types.join(","));
  }
  exports.getJSONTypes = getJSONTypes;
  function coerceAndCheckDataType(it, types) {
    const { gen, data, opts } = it;
    const coerceTo = coerceToTypes(types, opts.coerceTypes);
    const checkTypes = types.length > 0 && !(coerceTo.length === 0 && types.length === 1 && (0, applicability_1.schemaHasRulesForType)(it, types[0]));
    if (checkTypes) {
      const wrongType = checkDataTypes(types, data, opts.strictNumbers, DataType.Wrong);
      gen.if(wrongType, () => {
        if (coerceTo.length)
          coerceData(it, types, coerceTo);
        else
          reportTypeError(it);
      });
    }
    return checkTypes;
  }
  exports.coerceAndCheckDataType = coerceAndCheckDataType;
  var COERCIBLE = new Set(["string", "number", "integer", "boolean", "null"]);
  function coerceToTypes(types, coerceTypes) {
    return coerceTypes ? types.filter((t) => COERCIBLE.has(t) || coerceTypes === "array" && t === "array") : [];
  }
  function coerceData(it, types, coerceTo) {
    const { gen, data, opts } = it;
    const dataType = gen.let("dataType", (0, codegen_1._)`typeof ${data}`);
    const coerced = gen.let("coerced", (0, codegen_1._)`undefined`);
    if (opts.coerceTypes === "array") {
      gen.if((0, codegen_1._)`${dataType} == 'object' && Array.isArray(${data}) && ${data}.length == 1`, () => gen.assign(data, (0, codegen_1._)`${data}[0]`).assign(dataType, (0, codegen_1._)`typeof ${data}`).if(checkDataTypes(types, data, opts.strictNumbers), () => gen.assign(coerced, data)));
    }
    gen.if((0, codegen_1._)`${coerced} !== undefined`);
    for (const t of coerceTo) {
      if (COERCIBLE.has(t) || t === "array" && opts.coerceTypes === "array") {
        coerceSpecificType(t);
      }
    }
    gen.else();
    reportTypeError(it);
    gen.endIf();
    gen.if((0, codegen_1._)`${coerced} !== undefined`, () => {
      gen.assign(data, coerced);
      assignParentData(it, coerced);
    });
    function coerceSpecificType(t) {
      switch (t) {
        case "string":
          gen.elseIf((0, codegen_1._)`${dataType} == "number" || ${dataType} == "boolean"`).assign(coerced, (0, codegen_1._)`"" + ${data}`).elseIf((0, codegen_1._)`${data} === null`).assign(coerced, (0, codegen_1._)`""`);
          return;
        case "number":
          gen.elseIf((0, codegen_1._)`${dataType} == "boolean" || ${data} === null
              || (${dataType} == "string" && ${data} && ${data} == +${data})`).assign(coerced, (0, codegen_1._)`+${data}`);
          return;
        case "integer":
          gen.elseIf((0, codegen_1._)`${dataType} === "boolean" || ${data} === null
              || (${dataType} === "string" && ${data} && ${data} == +${data} && !(${data} % 1))`).assign(coerced, (0, codegen_1._)`+${data}`);
          return;
        case "boolean":
          gen.elseIf((0, codegen_1._)`${data} === "false" || ${data} === 0 || ${data} === null`).assign(coerced, false).elseIf((0, codegen_1._)`${data} === "true" || ${data} === 1`).assign(coerced, true);
          return;
        case "null":
          gen.elseIf((0, codegen_1._)`${data} === "" || ${data} === 0 || ${data} === false`);
          gen.assign(coerced, null);
          return;
        case "array":
          gen.elseIf((0, codegen_1._)`${dataType} === "string" || ${dataType} === "number"
              || ${dataType} === "boolean" || ${data} === null`).assign(coerced, (0, codegen_1._)`[${data}]`);
      }
    }
  }
  function assignParentData({ gen, parentData, parentDataProperty }, expr) {
    gen.if((0, codegen_1._)`${parentData} !== undefined`, () => gen.assign((0, codegen_1._)`${parentData}[${parentDataProperty}]`, expr));
  }
  function checkDataType(dataType, data, strictNums, correct = DataType.Correct) {
    const EQ = correct === DataType.Correct ? codegen_1.operators.EQ : codegen_1.operators.NEQ;
    let cond;
    switch (dataType) {
      case "null":
        return (0, codegen_1._)`${data} ${EQ} null`;
      case "array":
        cond = (0, codegen_1._)`Array.isArray(${data})`;
        break;
      case "object":
        cond = (0, codegen_1._)`${data} && typeof ${data} == "object" && !Array.isArray(${data})`;
        break;
      case "integer":
        cond = numCond((0, codegen_1._)`!(${data} % 1) && !isNaN(${data})`);
        break;
      case "number":
        cond = numCond();
        break;
      default:
        return (0, codegen_1._)`typeof ${data} ${EQ} ${dataType}`;
    }
    return correct === DataType.Correct ? cond : (0, codegen_1.not)(cond);
    function numCond(_cond = codegen_1.nil) {
      return (0, codegen_1.and)((0, codegen_1._)`typeof ${data} == "number"`, _cond, strictNums ? (0, codegen_1._)`isFinite(${data})` : codegen_1.nil);
    }
  }
  exports.checkDataType = checkDataType;
  function checkDataTypes(dataTypes, data, strictNums, correct) {
    if (dataTypes.length === 1) {
      return checkDataType(dataTypes[0], data, strictNums, correct);
    }
    let cond;
    const types = (0, util_1.toHash)(dataTypes);
    if (types.array && types.object) {
      const notObj = (0, codegen_1._)`typeof ${data} != "object"`;
      cond = types.null ? notObj : (0, codegen_1._)`!${data} || ${notObj}`;
      delete types.null;
      delete types.array;
      delete types.object;
    } else {
      cond = codegen_1.nil;
    }
    if (types.number)
      delete types.integer;
    for (const t in types)
      cond = (0, codegen_1.and)(cond, checkDataType(t, data, strictNums, correct));
    return cond;
  }
  exports.checkDataTypes = checkDataTypes;
  var typeError = {
    message: ({ schema }) => `must be ${schema}`,
    params: ({ schema, schemaValue }) => typeof schema == "string" ? (0, codegen_1._)`{type: ${schema}}` : (0, codegen_1._)`{type: ${schemaValue}}`
  };
  function reportTypeError(it) {
    const cxt = getTypeErrorContext(it);
    (0, errors_1.reportError)(cxt, typeError);
  }
  exports.reportTypeError = reportTypeError;
  function getTypeErrorContext(it) {
    const { gen, data, schema } = it;
    const schemaCode = (0, util_1.schemaRefOrVal)(it, schema, "type");
    return {
      gen,
      keyword: "type",
      data,
      schema: schema.type,
      schemaCode,
      schemaValue: schemaCode,
      parentSchema: schema,
      params: {},
      it
    };
  }
});

// node_modules/.pnpm/ajv@8.17.1/node_modules/ajv/dist/compile/validate/defaults.js
var require_defaults = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.assignDefaults = undefined;
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  function assignDefaults(it, ty) {
    const { properties, items } = it.schema;
    if (ty === "object" && properties) {
      for (const key in properties) {
        assignDefault(it, key, properties[key].default);
      }
    } else if (ty === "array" && Array.isArray(items)) {
      items.forEach((sch, i) => assignDefault(it, i, sch.default));
    }
  }
  exports.assignDefaults = assignDefaults;
  function assignDefault(it, prop, defaultValue) {
    const { gen, compositeRule, data, opts } = it;
    if (defaultValue === undefined)
      return;
    const childData = (0, codegen_1._)`${data}${(0, codegen_1.getProperty)(prop)}`;
    if (compositeRule) {
      (0, util_1.checkStrictMode)(it, `default is ignored for: ${childData}`);
      return;
    }
    let condition = (0, codegen_1._)`${childData} === undefined`;
    if (opts.useDefaults === "empty") {
      condition = (0, codegen_1._)`${condition} || ${childData} === null || ${childData} === ""`;
    }
    gen.if(condition, (0, codegen_1._)`${childData} = ${(0, codegen_1.stringify)(defaultValue)}`);
  }
});

// node_modules/.pnpm/ajv@8.17.1/node_modules/ajv/dist/vocabularies/code.js
var require_code2 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.validateUnion = exports.validateArray = exports.usePattern = exports.callValidateCode = exports.schemaProperties = exports.allSchemaProperties = exports.noPropertyInData = exports.propertyInData = exports.isOwnProperty = exports.hasPropFunc = exports.reportMissingProp = exports.checkMissingProp = exports.checkReportMissingProp = undefined;
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  var names_1 = require_names();
  var util_2 = require_util();
  function checkReportMissingProp(cxt, prop) {
    const { gen, data, it } = cxt;
    gen.if(noPropertyInData(gen, data, prop, it.opts.ownProperties), () => {
      cxt.setParams({ missingProperty: (0, codegen_1._)`${prop}` }, true);
      cxt.error();
    });
  }
  exports.checkReportMissingProp = checkReportMissingProp;
  function checkMissingProp({ gen, data, it: { opts } }, properties, missing) {
    return (0, codegen_1.or)(...properties.map((prop) => (0, codegen_1.and)(noPropertyInData(gen, data, prop, opts.ownProperties), (0, codegen_1._)`${missing} = ${prop}`)));
  }
  exports.checkMissingProp = checkMissingProp;
  function reportMissingProp(cxt, missing) {
    cxt.setParams({ missingProperty: missing }, true);
    cxt.error();
  }
  exports.reportMissingProp = reportMissingProp;
  function hasPropFunc(gen) {
    return gen.scopeValue("func", {
      ref: Object.prototype.hasOwnProperty,
      code: (0, codegen_1._)`Object.prototype.hasOwnProperty`
    });
  }
  exports.hasPropFunc = hasPropFunc;
  function isOwnProperty(gen, data, property) {
    return (0, codegen_1._)`${hasPropFunc(gen)}.call(${data}, ${property})`;
  }
  exports.isOwnProperty = isOwnProperty;
  function propertyInData(gen, data, property, ownProperties) {
    const cond = (0, codegen_1._)`${data}${(0, codegen_1.getProperty)(property)} !== undefined`;
    return ownProperties ? (0, codegen_1._)`${cond} && ${isOwnProperty(gen, data, property)}` : cond;
  }
  exports.propertyInData = propertyInData;
  function noPropertyInData(gen, data, property, ownProperties) {
    const cond = (0, codegen_1._)`${data}${(0, codegen_1.getProperty)(property)} === undefined`;
    return ownProperties ? (0, codegen_1.or)(cond, (0, codegen_1.not)(isOwnProperty(gen, data, property))) : cond;
  }
  exports.noPropertyInData = noPropertyInData;
  function allSchemaProperties(schemaMap) {
    return schemaMap ? Object.keys(schemaMap).filter((p) => p !== "__proto__") : [];
  }
  exports.allSchemaProperties = allSchemaProperties;
  function schemaProperties(it, schemaMap) {
    return allSchemaProperties(schemaMap).filter((p) => !(0, util_1.alwaysValidSchema)(it, schemaMap[p]));
  }
  exports.schemaProperties = schemaProperties;
  function callValidateCode({ schemaCode, data, it: { gen, topSchemaRef, schemaPath, errorPath }, it }, func, context, passSchema) {
    const dataAndSchema = passSchema ? (0, codegen_1._)`${schemaCode}, ${data}, ${topSchemaRef}${schemaPath}` : data;
    const valCxt = [
      [names_1.default.instancePath, (0, codegen_1.strConcat)(names_1.default.instancePath, errorPath)],
      [names_1.default.parentData, it.parentData],
      [names_1.default.parentDataProperty, it.parentDataProperty],
      [names_1.default.rootData, names_1.default.rootData]
    ];
    if (it.opts.dynamicRef)
      valCxt.push([names_1.default.dynamicAnchors, names_1.default.dynamicAnchors]);
    const args = (0, codegen_1._)`${dataAndSchema}, ${gen.object(...valCxt)}`;
    return context !== codegen_1.nil ? (0, codegen_1._)`${func}.call(${context}, ${args})` : (0, codegen_1._)`${func}(${args})`;
  }
  exports.callValidateCode = callValidateCode;
  var newRegExp = (0, codegen_1._)`new RegExp`;
  function usePattern({ gen, it: { opts } }, pattern) {
    const u = opts.unicodeRegExp ? "u" : "";
    const { regExp } = opts.code;
    const rx = regExp(pattern, u);
    return gen.scopeValue("pattern", {
      key: rx.toString(),
      ref: rx,
      code: (0, codegen_1._)`${regExp.code === "new RegExp" ? newRegExp : (0, util_2.useFunc)(gen, regExp)}(${pattern}, ${u})`
    });
  }
  exports.usePattern = usePattern;
  function validateArray(cxt) {
    const { gen, data, keyword, it } = cxt;
    const valid = gen.name("valid");
    if (it.allErrors) {
      const validArr = gen.let("valid", true);
      validateItems(() => gen.assign(validArr, false));
      return validArr;
    }
    gen.var(valid, true);
    validateItems(() => gen.break());
    return valid;
    function validateItems(notValid) {
      const len = gen.const("len", (0, codegen_1._)`${data}.length`);
      gen.forRange("i", 0, len, (i) => {
        cxt.subschema({
          keyword,
          dataProp: i,
          dataPropType: util_1.Type.Num
        }, valid);
        gen.if((0, codegen_1.not)(valid), notValid);
      });
    }
  }
  exports.validateArray = validateArray;
  function validateUnion(cxt) {
    const { gen, schema, keyword, it } = cxt;
    if (!Array.isArray(schema))
      throw new Error("ajv implementation error");
    const alwaysValid = schema.some((sch) => (0, util_1.alwaysValidSchema)(it, sch));
    if (alwaysValid && !it.opts.unevaluated)
      return;
    const valid = gen.let("valid", false);
    const schValid = gen.name("_valid");
    gen.block(() => schema.forEach((_sch, i) => {
      const schCxt = cxt.subschema({
        keyword,
        schemaProp: i,
        compositeRule: true
      }, schValid);
      gen.assign(valid, (0, codegen_1._)`${valid} || ${schValid}`);
      const merged = cxt.mergeValidEvaluated(schCxt, schValid);
      if (!merged)
        gen.if((0, codegen_1.not)(valid));
    }));
    cxt.result(valid, () => cxt.reset(), () => cxt.error(true));
  }
  exports.validateUnion = validateUnion;
});

// node_modules/.pnpm/ajv@8.17.1/node_modules/ajv/dist/compile/validate/keyword.js
var require_keyword = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.validateKeywordUsage = exports.validSchemaType = exports.funcKeywordCode = exports.macroKeywordCode = undefined;
  var codegen_1 = require_codegen();
  var names_1 = require_names();
  var code_1 = require_code2();
  var errors_1 = require_errors();
  function macroKeywordCode(cxt, def) {
    const { gen, keyword, schema, parentSchema, it } = cxt;
    const macroSchema = def.macro.call(it.self, schema, parentSchema, it);
    const schemaRef = useKeyword(gen, keyword, macroSchema);
    if (it.opts.validateSchema !== false)
      it.self.validateSchema(macroSchema, true);
    const valid = gen.name("valid");
    cxt.subschema({
      schema: macroSchema,
      schemaPath: codegen_1.nil,
      errSchemaPath: `${it.errSchemaPath}/${keyword}`,
      topSchemaRef: schemaRef,
      compositeRule: true
    }, valid);
    cxt.pass(valid, () => cxt.error(true));
  }
  exports.macroKeywordCode = macroKeywordCode;
  function funcKeywordCode(cxt, def) {
    var _a;
    const { gen, keyword, schema, parentSchema, $data, it } = cxt;
    checkAsyncKeyword(it, def);
    const validate = !$data && def.compile ? def.compile.call(it.self, schema, parentSchema, it) : def.validate;
    const validateRef = useKeyword(gen, keyword, validate);
    const valid = gen.let("valid");
    cxt.block$data(valid, validateKeyword);
    cxt.ok((_a = def.valid) !== null && _a !== undefined ? _a : valid);
    function validateKeyword() {
      if (def.errors === false) {
        assignValid();
        if (def.modifying)
          modifyData(cxt);
        reportErrs(() => cxt.error());
      } else {
        const ruleErrs = def.async ? validateAsync() : validateSync();
        if (def.modifying)
          modifyData(cxt);
        reportErrs(() => addErrs(cxt, ruleErrs));
      }
    }
    function validateAsync() {
      const ruleErrs = gen.let("ruleErrs", null);
      gen.try(() => assignValid((0, codegen_1._)`await `), (e) => gen.assign(valid, false).if((0, codegen_1._)`${e} instanceof ${it.ValidationError}`, () => gen.assign(ruleErrs, (0, codegen_1._)`${e}.errors`), () => gen.throw(e)));
      return ruleErrs;
    }
    function validateSync() {
      const validateErrs = (0, codegen_1._)`${validateRef}.errors`;
      gen.assign(validateErrs, null);
      assignValid(codegen_1.nil);
      return validateErrs;
    }
    function assignValid(_await = def.async ? (0, codegen_1._)`await ` : codegen_1.nil) {
      const passCxt = it.opts.passContext ? names_1.default.this : names_1.default.self;
      const passSchema = !(("compile" in def) && !$data || def.schema === false);
      gen.assign(valid, (0, codegen_1._)`${_await}${(0, code_1.callValidateCode)(cxt, validateRef, passCxt, passSchema)}`, def.modifying);
    }
    function reportErrs(errors) {
      var _a2;
      gen.if((0, codegen_1.not)((_a2 = def.valid) !== null && _a2 !== undefined ? _a2 : valid), errors);
    }
  }
  exports.funcKeywordCode = funcKeywordCode;
  function modifyData(cxt) {
    const { gen, data, it } = cxt;
    gen.if(it.parentData, () => gen.assign(data, (0, codegen_1._)`${it.parentData}[${it.parentDataProperty}]`));
  }
  function addErrs(cxt, errs) {
    const { gen } = cxt;
    gen.if((0, codegen_1._)`Array.isArray(${errs})`, () => {
      gen.assign(names_1.default.vErrors, (0, codegen_1._)`${names_1.default.vErrors} === null ? ${errs} : ${names_1.default.vErrors}.concat(${errs})`).assign(names_1.default.errors, (0, codegen_1._)`${names_1.default.vErrors}.length`);
      (0, errors_1.extendErrors)(cxt);
    }, () => cxt.error());
  }
  function checkAsyncKeyword({ schemaEnv }, def) {
    if (def.async && !schemaEnv.$async)
      throw new Error("async keyword in sync schema");
  }
  function useKeyword(gen, keyword, result) {
    if (result === undefined)
      throw new Error(`keyword "${keyword}" failed to compile`);
    return gen.scopeValue("keyword", typeof result == "function" ? { ref: result } : { ref: result, code: (0, codegen_1.stringify)(result) });
  }
  function validSchemaType(schema, schemaType, allowUndefined = false) {
    return !schemaType.length || schemaType.some((st) => st === "array" ? Array.isArray(schema) : st === "object" ? schema && typeof schema == "object" && !Array.isArray(schema) : typeof schema == st || allowUndefined && typeof schema == "undefined");
  }
  exports.validSchemaType = validSchemaType;
  function validateKeywordUsage({ schema, opts, self, errSchemaPath }, def, keyword) {
    if (Array.isArray(def.keyword) ? !def.keyword.includes(keyword) : def.keyword !== keyword) {
      throw new Error("ajv implementation error");
    }
    const deps = def.dependencies;
    if (deps === null || deps === undefined ? undefined : deps.some((kwd) => !Object.prototype.hasOwnProperty.call(schema, kwd))) {
      throw new Error(`parent schema must have dependencies of ${keyword}: ${deps.join(",")}`);
    }
    if (def.validateSchema) {
      const valid = def.validateSchema(schema[keyword]);
      if (!valid) {
        const msg = `keyword "${keyword}" value is invalid at path "${errSchemaPath}": ` + self.errorsText(def.validateSchema.errors);
        if (opts.validateSchema === "log")
          self.logger.error(msg);
        else
          throw new Error(msg);
      }
    }
  }
  exports.validateKeywordUsage = validateKeywordUsage;
});

// node_modules/.pnpm/ajv@8.17.1/node_modules/ajv/dist/compile/validate/subschema.js
var require_subschema = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.extendSubschemaMode = exports.extendSubschemaData = exports.getSubschema = undefined;
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  function getSubschema(it, { keyword, schemaProp, schema, schemaPath, errSchemaPath, topSchemaRef }) {
    if (keyword !== undefined && schema !== undefined) {
      throw new Error('both "keyword" and "schema" passed, only one allowed');
    }
    if (keyword !== undefined) {
      const sch = it.schema[keyword];
      return schemaProp === undefined ? {
        schema: sch,
        schemaPath: (0, codegen_1._)`${it.schemaPath}${(0, codegen_1.getProperty)(keyword)}`,
        errSchemaPath: `${it.errSchemaPath}/${keyword}`
      } : {
        schema: sch[schemaProp],
        schemaPath: (0, codegen_1._)`${it.schemaPath}${(0, codegen_1.getProperty)(keyword)}${(0, codegen_1.getProperty)(schemaProp)}`,
        errSchemaPath: `${it.errSchemaPath}/${keyword}/${(0, util_1.escapeFragment)(schemaProp)}`
      };
    }
    if (schema !== undefined) {
      if (schemaPath === undefined || errSchemaPath === undefined || topSchemaRef === undefined) {
        throw new Error('"schemaPath", "errSchemaPath" and "topSchemaRef" are required with "schema"');
      }
      return {
        schema,
        schemaPath,
        topSchemaRef,
        errSchemaPath
      };
    }
    throw new Error('either "keyword" or "schema" must be passed');
  }
  exports.getSubschema = getSubschema;
  function extendSubschemaData(subschema, it, { dataProp, dataPropType: dpType, data, dataTypes, propertyName }) {
    if (data !== undefined && dataProp !== undefined) {
      throw new Error('both "data" and "dataProp" passed, only one allowed');
    }
    const { gen } = it;
    if (dataProp !== undefined) {
      const { errorPath, dataPathArr, opts } = it;
      const nextData = gen.let("data", (0, codegen_1._)`${it.data}${(0, codegen_1.getProperty)(dataProp)}`, true);
      dataContextProps(nextData);
      subschema.errorPath = (0, codegen_1.str)`${errorPath}${(0, util_1.getErrorPath)(dataProp, dpType, opts.jsPropertySyntax)}`;
      subschema.parentDataProperty = (0, codegen_1._)`${dataProp}`;
      subschema.dataPathArr = [...dataPathArr, subschema.parentDataProperty];
    }
    if (data !== undefined) {
      const nextData = data instanceof codegen_1.Name ? data : gen.let("data", data, true);
      dataContextProps(nextData);
      if (propertyName !== undefined)
        subschema.propertyName = propertyName;
    }
    if (dataTypes)
      subschema.dataTypes = dataTypes;
    function dataContextProps(_nextData) {
      subschema.data = _nextData;
      subschema.dataLevel = it.dataLevel + 1;
      subschema.dataTypes = [];
      it.definedProperties = new Set;
      subschema.parentData = it.data;
      subschema.dataNames = [...it.dataNames, _nextData];
    }
  }
  exports.extendSubschemaData = extendSubschemaData;
  function extendSubschemaMode(subschema, { jtdDiscriminator, jtdMetadata, compositeRule, createErrors, allErrors }) {
    if (compositeRule !== undefined)
      subschema.compositeRule = compositeRule;
    if (createErrors !== undefined)
      subschema.createErrors = createErrors;
    if (allErrors !== undefined)
      subschema.allErrors = allErrors;
    subschema.jtdDiscriminator = jtdDiscriminator;
    subschema.jtdMetadata = jtdMetadata;
  }
  exports.extendSubschemaMode = extendSubschemaMode;
});

// node_modules/.pnpm/json-schema-traverse@1.0.0/node_modules/json-schema-traverse/index.js
var require_json_schema_traverse = __commonJS((exports, module) => {
  var traverse = module.exports = function(schema, opts, cb) {
    if (typeof opts == "function") {
      cb = opts;
      opts = {};
    }
    cb = opts.cb || cb;
    var pre = typeof cb == "function" ? cb : cb.pre || function() {};
    var post = cb.post || function() {};
    _traverse(opts, pre, post, schema, "", schema);
  };
  traverse.keywords = {
    additionalItems: true,
    items: true,
    contains: true,
    additionalProperties: true,
    propertyNames: true,
    not: true,
    if: true,
    then: true,
    else: true
  };
  traverse.arrayKeywords = {
    items: true,
    allOf: true,
    anyOf: true,
    oneOf: true
  };
  traverse.propsKeywords = {
    $defs: true,
    definitions: true,
    properties: true,
    patternProperties: true,
    dependencies: true
  };
  traverse.skipKeywords = {
    default: true,
    enum: true,
    const: true,
    required: true,
    maximum: true,
    minimum: true,
    exclusiveMaximum: true,
    exclusiveMinimum: true,
    multipleOf: true,
    maxLength: true,
    minLength: true,
    pattern: true,
    format: true,
    maxItems: true,
    minItems: true,
    uniqueItems: true,
    maxProperties: true,
    minProperties: true
  };
  function _traverse(opts, pre, post, schema, jsonPtr, rootSchema, parentJsonPtr, parentKeyword, parentSchema, keyIndex) {
    if (schema && typeof schema == "object" && !Array.isArray(schema)) {
      pre(schema, jsonPtr, rootSchema, parentJsonPtr, parentKeyword, parentSchema, keyIndex);
      for (var key in schema) {
        var sch = schema[key];
        if (Array.isArray(sch)) {
          if (key in traverse.arrayKeywords) {
            for (var i = 0;i < sch.length; i++)
              _traverse(opts, pre, post, sch[i], jsonPtr + "/" + key + "/" + i, rootSchema, jsonPtr, key, schema, i);
          }
        } else if (key in traverse.propsKeywords) {
          if (sch && typeof sch == "object") {
            for (var prop in sch)
              _traverse(opts, pre, post, sch[prop], jsonPtr + "/" + key + "/" + escapeJsonPtr(prop), rootSchema, jsonPtr, key, schema, prop);
          }
        } else if (key in traverse.keywords || opts.allKeys && !(key in traverse.skipKeywords)) {
          _traverse(opts, pre, post, sch, jsonPtr + "/" + key, rootSchema, jsonPtr, key, schema);
        }
      }
      post(schema, jsonPtr, rootSchema, parentJsonPtr, parentKeyword, parentSchema, keyIndex);
    }
  }
  function escapeJsonPtr(str) {
    return str.replace(/~/g, "~0").replace(/\//g, "~1");
  }
});

// node_modules/.pnpm/ajv@8.17.1/node_modules/ajv/dist/compile/resolve.js
var require_resolve = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.getSchemaRefs = exports.resolveUrl = exports.normalizeId = exports._getFullPath = exports.getFullPath = exports.inlineRef = undefined;
  var util_1 = require_util();
  var equal = require_fast_deep_equal();
  var traverse = require_json_schema_traverse();
  var SIMPLE_INLINED = new Set([
    "type",
    "format",
    "pattern",
    "maxLength",
    "minLength",
    "maxProperties",
    "minProperties",
    "maxItems",
    "minItems",
    "maximum",
    "minimum",
    "uniqueItems",
    "multipleOf",
    "required",
    "enum",
    "const"
  ]);
  function inlineRef(schema, limit = true) {
    if (typeof schema == "boolean")
      return true;
    if (limit === true)
      return !hasRef(schema);
    if (!limit)
      return false;
    return countKeys(schema) <= limit;
  }
  exports.inlineRef = inlineRef;
  var REF_KEYWORDS = new Set([
    "$ref",
    "$recursiveRef",
    "$recursiveAnchor",
    "$dynamicRef",
    "$dynamicAnchor"
  ]);
  function hasRef(schema) {
    for (const key in schema) {
      if (REF_KEYWORDS.has(key))
        return true;
      const sch = schema[key];
      if (Array.isArray(sch) && sch.some(hasRef))
        return true;
      if (typeof sch == "object" && hasRef(sch))
        return true;
    }
    return false;
  }
  function countKeys(schema) {
    let count = 0;
    for (const key in schema) {
      if (key === "$ref")
        return Infinity;
      count++;
      if (SIMPLE_INLINED.has(key))
        continue;
      if (typeof schema[key] == "object") {
        (0, util_1.eachItem)(schema[key], (sch) => count += countKeys(sch));
      }
      if (count === Infinity)
        return Infinity;
    }
    return count;
  }
  function getFullPath(resolver, id = "", normalize) {
    if (normalize !== false)
      id = normalizeId(id);
    const p = resolver.parse(id);
    return _getFullPath(resolver, p);
  }
  exports.getFullPath = getFullPath;
  function _getFullPath(resolver, p) {
    const serialized = resolver.serialize(p);
    return serialized.split("#")[0] + "#";
  }
  exports._getFullPath = _getFullPath;
  var TRAILING_SLASH_HASH = /#\/?$/;
  function normalizeId(id) {
    return id ? id.replace(TRAILING_SLASH_HASH, "") : "";
  }
  exports.normalizeId = normalizeId;
  function resolveUrl(resolver, baseId, id) {
    id = normalizeId(id);
    return resolver.resolve(baseId, id);
  }
  exports.resolveUrl = resolveUrl;
  var ANCHOR = /^[a-z_][-a-z0-9._]*$/i;
  function getSchemaRefs(schema, baseId) {
    if (typeof schema == "boolean")
      return {};
    const { schemaId, uriResolver } = this.opts;
    const schId = normalizeId(schema[schemaId] || baseId);
    const baseIds = { "": schId };
    const pathPrefix = getFullPath(uriResolver, schId, false);
    const localRefs = {};
    const schemaRefs = new Set;
    traverse(schema, { allKeys: true }, (sch, jsonPtr, _, parentJsonPtr) => {
      if (parentJsonPtr === undefined)
        return;
      const fullPath = pathPrefix + jsonPtr;
      let innerBaseId = baseIds[parentJsonPtr];
      if (typeof sch[schemaId] == "string")
        innerBaseId = addRef.call(this, sch[schemaId]);
      addAnchor.call(this, sch.$anchor);
      addAnchor.call(this, sch.$dynamicAnchor);
      baseIds[jsonPtr] = innerBaseId;
      function addRef(ref) {
        const _resolve = this.opts.uriResolver.resolve;
        ref = normalizeId(innerBaseId ? _resolve(innerBaseId, ref) : ref);
        if (schemaRefs.has(ref))
          throw ambiguos(ref);
        schemaRefs.add(ref);
        let schOrRef = this.refs[ref];
        if (typeof schOrRef == "string")
          schOrRef = this.refs[schOrRef];
        if (typeof schOrRef == "object") {
          checkAmbiguosRef(sch, schOrRef.schema, ref);
        } else if (ref !== normalizeId(fullPath)) {
          if (ref[0] === "#") {
            checkAmbiguosRef(sch, localRefs[ref], ref);
            localRefs[ref] = sch;
          } else {
            this.refs[ref] = fullPath;
          }
        }
        return ref;
      }
      function addAnchor(anchor) {
        if (typeof anchor == "string") {
          if (!ANCHOR.test(anchor))
            throw new Error(`invalid anchor "${anchor}"`);
          addRef.call(this, `#${anchor}`);
        }
      }
    });
    return localRefs;
    function checkAmbiguosRef(sch1, sch2, ref) {
      if (sch2 !== undefined && !equal(sch1, sch2))
        throw ambiguos(ref);
    }
    function ambiguos(ref) {
      return new Error(`reference "${ref}" resolves to more than one schema`);
    }
  }
  exports.getSchemaRefs = getSchemaRefs;
});

// node_modules/.pnpm/ajv@8.17.1/node_modules/ajv/dist/compile/validate/index.js
var require_validate = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.getData = exports.KeywordCxt = exports.validateFunctionCode = undefined;
  var boolSchema_1 = require_boolSchema();
  var dataType_1 = require_dataType();
  var applicability_1 = require_applicability();
  var dataType_2 = require_dataType();
  var defaults_1 = require_defaults();
  var keyword_1 = require_keyword();
  var subschema_1 = require_subschema();
  var codegen_1 = require_codegen();
  var names_1 = require_names();
  var resolve_1 = require_resolve();
  var util_1 = require_util();
  var errors_1 = require_errors();
  function validateFunctionCode(it) {
    if (isSchemaObj(it)) {
      checkKeywords(it);
      if (schemaCxtHasRules(it)) {
        topSchemaObjCode(it);
        return;
      }
    }
    validateFunction(it, () => (0, boolSchema_1.topBoolOrEmptySchema)(it));
  }
  exports.validateFunctionCode = validateFunctionCode;
  function validateFunction({ gen, validateName, schema, schemaEnv, opts }, body) {
    if (opts.code.es5) {
      gen.func(validateName, (0, codegen_1._)`${names_1.default.data}, ${names_1.default.valCxt}`, schemaEnv.$async, () => {
        gen.code((0, codegen_1._)`"use strict"; ${funcSourceUrl(schema, opts)}`);
        destructureValCxtES5(gen, opts);
        gen.code(body);
      });
    } else {
      gen.func(validateName, (0, codegen_1._)`${names_1.default.data}, ${destructureValCxt(opts)}`, schemaEnv.$async, () => gen.code(funcSourceUrl(schema, opts)).code(body));
    }
  }
  function destructureValCxt(opts) {
    return (0, codegen_1._)`{${names_1.default.instancePath}="", ${names_1.default.parentData}, ${names_1.default.parentDataProperty}, ${names_1.default.rootData}=${names_1.default.data}${opts.dynamicRef ? (0, codegen_1._)`, ${names_1.default.dynamicAnchors}={}` : codegen_1.nil}}={}`;
  }
  function destructureValCxtES5(gen, opts) {
    gen.if(names_1.default.valCxt, () => {
      gen.var(names_1.default.instancePath, (0, codegen_1._)`${names_1.default.valCxt}.${names_1.default.instancePath}`);
      gen.var(names_1.default.parentData, (0, codegen_1._)`${names_1.default.valCxt}.${names_1.default.parentData}`);
      gen.var(names_1.default.parentDataProperty, (0, codegen_1._)`${names_1.default.valCxt}.${names_1.default.parentDataProperty}`);
      gen.var(names_1.default.rootData, (0, codegen_1._)`${names_1.default.valCxt}.${names_1.default.rootData}`);
      if (opts.dynamicRef)
        gen.var(names_1.default.dynamicAnchors, (0, codegen_1._)`${names_1.default.valCxt}.${names_1.default.dynamicAnchors}`);
    }, () => {
      gen.var(names_1.default.instancePath, (0, codegen_1._)`""`);
      gen.var(names_1.default.parentData, (0, codegen_1._)`undefined`);
      gen.var(names_1.default.parentDataProperty, (0, codegen_1._)`undefined`);
      gen.var(names_1.default.rootData, names_1.default.data);
      if (opts.dynamicRef)
        gen.var(names_1.default.dynamicAnchors, (0, codegen_1._)`{}`);
    });
  }
  function topSchemaObjCode(it) {
    const { schema, opts, gen } = it;
    validateFunction(it, () => {
      if (opts.$comment && schema.$comment)
        commentKeyword(it);
      checkNoDefault(it);
      gen.let(names_1.default.vErrors, null);
      gen.let(names_1.default.errors, 0);
      if (opts.unevaluated)
        resetEvaluated(it);
      typeAndKeywords(it);
      returnResults(it);
    });
    return;
  }
  function resetEvaluated(it) {
    const { gen, validateName } = it;
    it.evaluated = gen.const("evaluated", (0, codegen_1._)`${validateName}.evaluated`);
    gen.if((0, codegen_1._)`${it.evaluated}.dynamicProps`, () => gen.assign((0, codegen_1._)`${it.evaluated}.props`, (0, codegen_1._)`undefined`));
    gen.if((0, codegen_1._)`${it.evaluated}.dynamicItems`, () => gen.assign((0, codegen_1._)`${it.evaluated}.items`, (0, codegen_1._)`undefined`));
  }
  function funcSourceUrl(schema, opts) {
    const schId = typeof schema == "object" && schema[opts.schemaId];
    return schId && (opts.code.source || opts.code.process) ? (0, codegen_1._)`/*# sourceURL=${schId} */` : codegen_1.nil;
  }
  function subschemaCode(it, valid) {
    if (isSchemaObj(it)) {
      checkKeywords(it);
      if (schemaCxtHasRules(it)) {
        subSchemaObjCode(it, valid);
        return;
      }
    }
    (0, boolSchema_1.boolOrEmptySchema)(it, valid);
  }
  function schemaCxtHasRules({ schema, self }) {
    if (typeof schema == "boolean")
      return !schema;
    for (const key in schema)
      if (self.RULES.all[key])
        return true;
    return false;
  }
  function isSchemaObj(it) {
    return typeof it.schema != "boolean";
  }
  function subSchemaObjCode(it, valid) {
    const { schema, gen, opts } = it;
    if (opts.$comment && schema.$comment)
      commentKeyword(it);
    updateContext(it);
    checkAsyncSchema(it);
    const errsCount = gen.const("_errs", names_1.default.errors);
    typeAndKeywords(it, errsCount);
    gen.var(valid, (0, codegen_1._)`${errsCount} === ${names_1.default.errors}`);
  }
  function checkKeywords(it) {
    (0, util_1.checkUnknownRules)(it);
    checkRefsAndKeywords(it);
  }
  function typeAndKeywords(it, errsCount) {
    if (it.opts.jtd)
      return schemaKeywords(it, [], false, errsCount);
    const types = (0, dataType_1.getSchemaTypes)(it.schema);
    const checkedTypes = (0, dataType_1.coerceAndCheckDataType)(it, types);
    schemaKeywords(it, types, !checkedTypes, errsCount);
  }
  function checkRefsAndKeywords(it) {
    const { schema, errSchemaPath, opts, self } = it;
    if (schema.$ref && opts.ignoreKeywordsWithRef && (0, util_1.schemaHasRulesButRef)(schema, self.RULES)) {
      self.logger.warn(`$ref: keywords ignored in schema at path "${errSchemaPath}"`);
    }
  }
  function checkNoDefault(it) {
    const { schema, opts } = it;
    if (schema.default !== undefined && opts.useDefaults && opts.strictSchema) {
      (0, util_1.checkStrictMode)(it, "default is ignored in the schema root");
    }
  }
  function updateContext(it) {
    const schId = it.schema[it.opts.schemaId];
    if (schId)
      it.baseId = (0, resolve_1.resolveUrl)(it.opts.uriResolver, it.baseId, schId);
  }
  function checkAsyncSchema(it) {
    if (it.schema.$async && !it.schemaEnv.$async)
      throw new Error("async schema in sync schema");
  }
  function commentKeyword({ gen, schemaEnv, schema, errSchemaPath, opts }) {
    const msg = schema.$comment;
    if (opts.$comment === true) {
      gen.code((0, codegen_1._)`${names_1.default.self}.logger.log(${msg})`);
    } else if (typeof opts.$comment == "function") {
      const schemaPath = (0, codegen_1.str)`${errSchemaPath}/$comment`;
      const rootName = gen.scopeValue("root", { ref: schemaEnv.root });
      gen.code((0, codegen_1._)`${names_1.default.self}.opts.$comment(${msg}, ${schemaPath}, ${rootName}.schema)`);
    }
  }
  function returnResults(it) {
    const { gen, schemaEnv, validateName, ValidationError, opts } = it;
    if (schemaEnv.$async) {
      gen.if((0, codegen_1._)`${names_1.default.errors} === 0`, () => gen.return(names_1.default.data), () => gen.throw((0, codegen_1._)`new ${ValidationError}(${names_1.default.vErrors})`));
    } else {
      gen.assign((0, codegen_1._)`${validateName}.errors`, names_1.default.vErrors);
      if (opts.unevaluated)
        assignEvaluated(it);
      gen.return((0, codegen_1._)`${names_1.default.errors} === 0`);
    }
  }
  function assignEvaluated({ gen, evaluated, props, items }) {
    if (props instanceof codegen_1.Name)
      gen.assign((0, codegen_1._)`${evaluated}.props`, props);
    if (items instanceof codegen_1.Name)
      gen.assign((0, codegen_1._)`${evaluated}.items`, items);
  }
  function schemaKeywords(it, types, typeErrors, errsCount) {
    const { gen, schema, data, allErrors, opts, self } = it;
    const { RULES } = self;
    if (schema.$ref && (opts.ignoreKeywordsWithRef || !(0, util_1.schemaHasRulesButRef)(schema, RULES))) {
      gen.block(() => keywordCode(it, "$ref", RULES.all.$ref.definition));
      return;
    }
    if (!opts.jtd)
      checkStrictTypes(it, types);
    gen.block(() => {
      for (const group of RULES.rules)
        groupKeywords(group);
      groupKeywords(RULES.post);
    });
    function groupKeywords(group) {
      if (!(0, applicability_1.shouldUseGroup)(schema, group))
        return;
      if (group.type) {
        gen.if((0, dataType_2.checkDataType)(group.type, data, opts.strictNumbers));
        iterateKeywords(it, group);
        if (types.length === 1 && types[0] === group.type && typeErrors) {
          gen.else();
          (0, dataType_2.reportTypeError)(it);
        }
        gen.endIf();
      } else {
        iterateKeywords(it, group);
      }
      if (!allErrors)
        gen.if((0, codegen_1._)`${names_1.default.errors} === ${errsCount || 0}`);
    }
  }
  function iterateKeywords(it, group) {
    const { gen, schema, opts: { useDefaults } } = it;
    if (useDefaults)
      (0, defaults_1.assignDefaults)(it, group.type);
    gen.block(() => {
      for (const rule of group.rules) {
        if ((0, applicability_1.shouldUseRule)(schema, rule)) {
          keywordCode(it, rule.keyword, rule.definition, group.type);
        }
      }
    });
  }
  function checkStrictTypes(it, types) {
    if (it.schemaEnv.meta || !it.opts.strictTypes)
      return;
    checkContextTypes(it, types);
    if (!it.opts.allowUnionTypes)
      checkMultipleTypes(it, types);
    checkKeywordTypes(it, it.dataTypes);
  }
  function checkContextTypes(it, types) {
    if (!types.length)
      return;
    if (!it.dataTypes.length) {
      it.dataTypes = types;
      return;
    }
    types.forEach((t) => {
      if (!includesType(it.dataTypes, t)) {
        strictTypesError(it, `type "${t}" not allowed by context "${it.dataTypes.join(",")}"`);
      }
    });
    narrowSchemaTypes(it, types);
  }
  function checkMultipleTypes(it, ts) {
    if (ts.length > 1 && !(ts.length === 2 && ts.includes("null"))) {
      strictTypesError(it, "use allowUnionTypes to allow union type keyword");
    }
  }
  function checkKeywordTypes(it, ts) {
    const rules = it.self.RULES.all;
    for (const keyword in rules) {
      const rule = rules[keyword];
      if (typeof rule == "object" && (0, applicability_1.shouldUseRule)(it.schema, rule)) {
        const { type } = rule.definition;
        if (type.length && !type.some((t) => hasApplicableType(ts, t))) {
          strictTypesError(it, `missing type "${type.join(",")}" for keyword "${keyword}"`);
        }
      }
    }
  }
  function hasApplicableType(schTs, kwdT) {
    return schTs.includes(kwdT) || kwdT === "number" && schTs.includes("integer");
  }
  function includesType(ts, t) {
    return ts.includes(t) || t === "integer" && ts.includes("number");
  }
  function narrowSchemaTypes(it, withTypes) {
    const ts = [];
    for (const t of it.dataTypes) {
      if (includesType(withTypes, t))
        ts.push(t);
      else if (withTypes.includes("integer") && t === "number")
        ts.push("integer");
    }
    it.dataTypes = ts;
  }
  function strictTypesError(it, msg) {
    const schemaPath = it.schemaEnv.baseId + it.errSchemaPath;
    msg += ` at "${schemaPath}" (strictTypes)`;
    (0, util_1.checkStrictMode)(it, msg, it.opts.strictTypes);
  }

  class KeywordCxt {
    constructor(it, def, keyword) {
      (0, keyword_1.validateKeywordUsage)(it, def, keyword);
      this.gen = it.gen;
      this.allErrors = it.allErrors;
      this.keyword = keyword;
      this.data = it.data;
      this.schema = it.schema[keyword];
      this.$data = def.$data && it.opts.$data && this.schema && this.schema.$data;
      this.schemaValue = (0, util_1.schemaRefOrVal)(it, this.schema, keyword, this.$data);
      this.schemaType = def.schemaType;
      this.parentSchema = it.schema;
      this.params = {};
      this.it = it;
      this.def = def;
      if (this.$data) {
        this.schemaCode = it.gen.const("vSchema", getData(this.$data, it));
      } else {
        this.schemaCode = this.schemaValue;
        if (!(0, keyword_1.validSchemaType)(this.schema, def.schemaType, def.allowUndefined)) {
          throw new Error(`${keyword} value must be ${JSON.stringify(def.schemaType)}`);
        }
      }
      if ("code" in def ? def.trackErrors : def.errors !== false) {
        this.errsCount = it.gen.const("_errs", names_1.default.errors);
      }
    }
    result(condition, successAction, failAction) {
      this.failResult((0, codegen_1.not)(condition), successAction, failAction);
    }
    failResult(condition, successAction, failAction) {
      this.gen.if(condition);
      if (failAction)
        failAction();
      else
        this.error();
      if (successAction) {
        this.gen.else();
        successAction();
        if (this.allErrors)
          this.gen.endIf();
      } else {
        if (this.allErrors)
          this.gen.endIf();
        else
          this.gen.else();
      }
    }
    pass(condition, failAction) {
      this.failResult((0, codegen_1.not)(condition), undefined, failAction);
    }
    fail(condition) {
      if (condition === undefined) {
        this.error();
        if (!this.allErrors)
          this.gen.if(false);
        return;
      }
      this.gen.if(condition);
      this.error();
      if (this.allErrors)
        this.gen.endIf();
      else
        this.gen.else();
    }
    fail$data(condition) {
      if (!this.$data)
        return this.fail(condition);
      const { schemaCode } = this;
      this.fail((0, codegen_1._)`${schemaCode} !== undefined && (${(0, codegen_1.or)(this.invalid$data(), condition)})`);
    }
    error(append, errorParams, errorPaths) {
      if (errorParams) {
        this.setParams(errorParams);
        this._error(append, errorPaths);
        this.setParams({});
        return;
      }
      this._error(append, errorPaths);
    }
    _error(append, errorPaths) {
      (append ? errors_1.reportExtraError : errors_1.reportError)(this, this.def.error, errorPaths);
    }
    $dataError() {
      (0, errors_1.reportError)(this, this.def.$dataError || errors_1.keyword$DataError);
    }
    reset() {
      if (this.errsCount === undefined)
        throw new Error('add "trackErrors" to keyword definition');
      (0, errors_1.resetErrorsCount)(this.gen, this.errsCount);
    }
    ok(cond) {
      if (!this.allErrors)
        this.gen.if(cond);
    }
    setParams(obj, assign) {
      if (assign)
        Object.assign(this.params, obj);
      else
        this.params = obj;
    }
    block$data(valid, codeBlock, $dataValid = codegen_1.nil) {
      this.gen.block(() => {
        this.check$data(valid, $dataValid);
        codeBlock();
      });
    }
    check$data(valid = codegen_1.nil, $dataValid = codegen_1.nil) {
      if (!this.$data)
        return;
      const { gen, schemaCode, schemaType, def } = this;
      gen.if((0, codegen_1.or)((0, codegen_1._)`${schemaCode} === undefined`, $dataValid));
      if (valid !== codegen_1.nil)
        gen.assign(valid, true);
      if (schemaType.length || def.validateSchema) {
        gen.elseIf(this.invalid$data());
        this.$dataError();
        if (valid !== codegen_1.nil)
          gen.assign(valid, false);
      }
      gen.else();
    }
    invalid$data() {
      const { gen, schemaCode, schemaType, def, it } = this;
      return (0, codegen_1.or)(wrong$DataType(), invalid$DataSchema());
      function wrong$DataType() {
        if (schemaType.length) {
          if (!(schemaCode instanceof codegen_1.Name))
            throw new Error("ajv implementation error");
          const st = Array.isArray(schemaType) ? schemaType : [schemaType];
          return (0, codegen_1._)`${(0, dataType_2.checkDataTypes)(st, schemaCode, it.opts.strictNumbers, dataType_2.DataType.Wrong)}`;
        }
        return codegen_1.nil;
      }
      function invalid$DataSchema() {
        if (def.validateSchema) {
          const validateSchemaRef = gen.scopeValue("validate$data", { ref: def.validateSchema });
          return (0, codegen_1._)`!${validateSchemaRef}(${schemaCode})`;
        }
        return codegen_1.nil;
      }
    }
    subschema(appl, valid) {
      const subschema = (0, subschema_1.getSubschema)(this.it, appl);
      (0, subschema_1.extendSubschemaData)(subschema, this.it, appl);
      (0, subschema_1.extendSubschemaMode)(subschema, appl);
      const nextContext = { ...this.it, ...subschema, items: undefined, props: undefined };
      subschemaCode(nextContext, valid);
      return nextContext;
    }
    mergeEvaluated(schemaCxt, toName) {
      const { it, gen } = this;
      if (!it.opts.unevaluated)
        return;
      if (it.props !== true && schemaCxt.props !== undefined) {
        it.props = util_1.mergeEvaluated.props(gen, schemaCxt.props, it.props, toName);
      }
      if (it.items !== true && schemaCxt.items !== undefined) {
        it.items = util_1.mergeEvaluated.items(gen, schemaCxt.items, it.items, toName);
      }
    }
    mergeValidEvaluated(schemaCxt, valid) {
      const { it, gen } = this;
      if (it.opts.unevaluated && (it.props !== true || it.items !== true)) {
        gen.if(valid, () => this.mergeEvaluated(schemaCxt, codegen_1.Name));
        return true;
      }
    }
  }
  exports.KeywordCxt = KeywordCxt;
  function keywordCode(it, keyword, def, ruleType) {
    const cxt = new KeywordCxt(it, def, keyword);
    if ("code" in def) {
      def.code(cxt, ruleType);
    } else if (cxt.$data && def.validate) {
      (0, keyword_1.funcKeywordCode)(cxt, def);
    } else if ("macro" in def) {
      (0, keyword_1.macroKeywordCode)(cxt, def);
    } else if (def.compile || def.validate) {
      (0, keyword_1.funcKeywordCode)(cxt, def);
    }
  }
  var JSON_POINTER = /^\/(?:[^~]|~0|~1)*$/;
  var RELATIVE_JSON_POINTER = /^([0-9]+)(#|\/(?:[^~]|~0|~1)*)?$/;
  function getData($data, { dataLevel, dataNames, dataPathArr }) {
    let jsonPointer;
    let data;
    if ($data === "")
      return names_1.default.rootData;
    if ($data[0] === "/") {
      if (!JSON_POINTER.test($data))
        throw new Error(`Invalid JSON-pointer: ${$data}`);
      jsonPointer = $data;
      data = names_1.default.rootData;
    } else {
      const matches = RELATIVE_JSON_POINTER.exec($data);
      if (!matches)
        throw new Error(`Invalid JSON-pointer: ${$data}`);
      const up = +matches[1];
      jsonPointer = matches[2];
      if (jsonPointer === "#") {
        if (up >= dataLevel)
          throw new Error(errorMsg("property/index", up));
        return dataPathArr[dataLevel - up];
      }
      if (up > dataLevel)
        throw new Error(errorMsg("data", up));
      data = dataNames[dataLevel - up];
      if (!jsonPointer)
        return data;
    }
    let expr = data;
    const segments = jsonPointer.split("/");
    for (const segment of segments) {
      if (segment) {
        data = (0, codegen_1._)`${data}${(0, codegen_1.getProperty)((0, util_1.unescapeJsonPointer)(segment))}`;
        expr = (0, codegen_1._)`${expr} && ${data}`;
      }
    }
    return expr;
    function errorMsg(pointerType, up) {
      return `Cannot access ${pointerType} ${up} levels up, current level is ${dataLevel}`;
    }
  }
  exports.getData = getData;
});

// node_modules/.pnpm/ajv@8.17.1/node_modules/ajv/dist/runtime/validation_error.js
var require_validation_error = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });

  class ValidationError extends Error {
    constructor(errors) {
      super("validation failed");
      this.errors = errors;
      this.ajv = this.validation = true;
    }
  }
  exports.default = ValidationError;
});

// node_modules/.pnpm/ajv@8.17.1/node_modules/ajv/dist/compile/ref_error.js
var require_ref_error = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var resolve_1 = require_resolve();

  class MissingRefError extends Error {
    constructor(resolver, baseId, ref, msg) {
      super(msg || `can't resolve reference ${ref} from id ${baseId}`);
      this.missingRef = (0, resolve_1.resolveUrl)(resolver, baseId, ref);
      this.missingSchema = (0, resolve_1.normalizeId)((0, resolve_1.getFullPath)(resolver, this.missingRef));
    }
  }
  exports.default = MissingRefError;
});

// node_modules/.pnpm/ajv@8.17.1/node_modules/ajv/dist/compile/index.js
var require_compile = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.resolveSchema = exports.getCompilingSchema = exports.resolveRef = exports.compileSchema = exports.SchemaEnv = undefined;
  var codegen_1 = require_codegen();
  var validation_error_1 = require_validation_error();
  var names_1 = require_names();
  var resolve_1 = require_resolve();
  var util_1 = require_util();
  var validate_1 = require_validate();

  class SchemaEnv {
    constructor(env) {
      var _a;
      this.refs = {};
      this.dynamicAnchors = {};
      let schema;
      if (typeof env.schema == "object")
        schema = env.schema;
      this.schema = env.schema;
      this.schemaId = env.schemaId;
      this.root = env.root || this;
      this.baseId = (_a = env.baseId) !== null && _a !== undefined ? _a : (0, resolve_1.normalizeId)(schema === null || schema === undefined ? undefined : schema[env.schemaId || "$id"]);
      this.schemaPath = env.schemaPath;
      this.localRefs = env.localRefs;
      this.meta = env.meta;
      this.$async = schema === null || schema === undefined ? undefined : schema.$async;
      this.refs = {};
    }
  }
  exports.SchemaEnv = SchemaEnv;
  function compileSchema(sch) {
    const _sch = getCompilingSchema.call(this, sch);
    if (_sch)
      return _sch;
    const rootId = (0, resolve_1.getFullPath)(this.opts.uriResolver, sch.root.baseId);
    const { es5, lines } = this.opts.code;
    const { ownProperties } = this.opts;
    const gen = new codegen_1.CodeGen(this.scope, { es5, lines, ownProperties });
    let _ValidationError;
    if (sch.$async) {
      _ValidationError = gen.scopeValue("Error", {
        ref: validation_error_1.default,
        code: (0, codegen_1._)`require("ajv/dist/runtime/validation_error").default`
      });
    }
    const validateName = gen.scopeName("validate");
    sch.validateName = validateName;
    const schemaCxt = {
      gen,
      allErrors: this.opts.allErrors,
      data: names_1.default.data,
      parentData: names_1.default.parentData,
      parentDataProperty: names_1.default.parentDataProperty,
      dataNames: [names_1.default.data],
      dataPathArr: [codegen_1.nil],
      dataLevel: 0,
      dataTypes: [],
      definedProperties: new Set,
      topSchemaRef: gen.scopeValue("schema", this.opts.code.source === true ? { ref: sch.schema, code: (0, codegen_1.stringify)(sch.schema) } : { ref: sch.schema }),
      validateName,
      ValidationError: _ValidationError,
      schema: sch.schema,
      schemaEnv: sch,
      rootId,
      baseId: sch.baseId || rootId,
      schemaPath: codegen_1.nil,
      errSchemaPath: sch.schemaPath || (this.opts.jtd ? "" : "#"),
      errorPath: (0, codegen_1._)`""`,
      opts: this.opts,
      self: this
    };
    let sourceCode;
    try {
      this._compilations.add(sch);
      (0, validate_1.validateFunctionCode)(schemaCxt);
      gen.optimize(this.opts.code.optimize);
      const validateCode = gen.toString();
      sourceCode = `${gen.scopeRefs(names_1.default.scope)}return ${validateCode}`;
      if (this.opts.code.process)
        sourceCode = this.opts.code.process(sourceCode, sch);
      const makeValidate = new Function(`${names_1.default.self}`, `${names_1.default.scope}`, sourceCode);
      const validate = makeValidate(this, this.scope.get());
      this.scope.value(validateName, { ref: validate });
      validate.errors = null;
      validate.schema = sch.schema;
      validate.schemaEnv = sch;
      if (sch.$async)
        validate.$async = true;
      if (this.opts.code.source === true) {
        validate.source = { validateName, validateCode, scopeValues: gen._values };
      }
      if (this.opts.unevaluated) {
        const { props, items } = schemaCxt;
        validate.evaluated = {
          props: props instanceof codegen_1.Name ? undefined : props,
          items: items instanceof codegen_1.Name ? undefined : items,
          dynamicProps: props instanceof codegen_1.Name,
          dynamicItems: items instanceof codegen_1.Name
        };
        if (validate.source)
          validate.source.evaluated = (0, codegen_1.stringify)(validate.evaluated);
      }
      sch.validate = validate;
      return sch;
    } catch (e) {
      delete sch.validate;
      delete sch.validateName;
      if (sourceCode)
        this.logger.error("Error compiling schema, function code:", sourceCode);
      throw e;
    } finally {
      this._compilations.delete(sch);
    }
  }
  exports.compileSchema = compileSchema;
  function resolveRef(root, baseId, ref) {
    var _a;
    ref = (0, resolve_1.resolveUrl)(this.opts.uriResolver, baseId, ref);
    const schOrFunc = root.refs[ref];
    if (schOrFunc)
      return schOrFunc;
    let _sch = resolve.call(this, root, ref);
    if (_sch === undefined) {
      const schema = (_a = root.localRefs) === null || _a === undefined ? undefined : _a[ref];
      const { schemaId } = this.opts;
      if (schema)
        _sch = new SchemaEnv({ schema, schemaId, root, baseId });
    }
    if (_sch === undefined)
      return;
    return root.refs[ref] = inlineOrCompile.call(this, _sch);
  }
  exports.resolveRef = resolveRef;
  function inlineOrCompile(sch) {
    if ((0, resolve_1.inlineRef)(sch.schema, this.opts.inlineRefs))
      return sch.schema;
    return sch.validate ? sch : compileSchema.call(this, sch);
  }
  function getCompilingSchema(schEnv) {
    for (const sch of this._compilations) {
      if (sameSchemaEnv(sch, schEnv))
        return sch;
    }
  }
  exports.getCompilingSchema = getCompilingSchema;
  function sameSchemaEnv(s1, s2) {
    return s1.schema === s2.schema && s1.root === s2.root && s1.baseId === s2.baseId;
  }
  function resolve(root, ref) {
    let sch;
    while (typeof (sch = this.refs[ref]) == "string")
      ref = sch;
    return sch || this.schemas[ref] || resolveSchema.call(this, root, ref);
  }
  function resolveSchema(root, ref) {
    const p = this.opts.uriResolver.parse(ref);
    const refPath = (0, resolve_1._getFullPath)(this.opts.uriResolver, p);
    let baseId = (0, resolve_1.getFullPath)(this.opts.uriResolver, root.baseId, undefined);
    if (Object.keys(root.schema).length > 0 && refPath === baseId) {
      return getJsonPointer.call(this, p, root);
    }
    const id = (0, resolve_1.normalizeId)(refPath);
    const schOrRef = this.refs[id] || this.schemas[id];
    if (typeof schOrRef == "string") {
      const sch = resolveSchema.call(this, root, schOrRef);
      if (typeof (sch === null || sch === undefined ? undefined : sch.schema) !== "object")
        return;
      return getJsonPointer.call(this, p, sch);
    }
    if (typeof (schOrRef === null || schOrRef === undefined ? undefined : schOrRef.schema) !== "object")
      return;
    if (!schOrRef.validate)
      compileSchema.call(this, schOrRef);
    if (id === (0, resolve_1.normalizeId)(ref)) {
      const { schema } = schOrRef;
      const { schemaId } = this.opts;
      const schId = schema[schemaId];
      if (schId)
        baseId = (0, resolve_1.resolveUrl)(this.opts.uriResolver, baseId, schId);
      return new SchemaEnv({ schema, schemaId, root, baseId });
    }
    return getJsonPointer.call(this, p, schOrRef);
  }
  exports.resolveSchema = resolveSchema;
  var PREVENT_SCOPE_CHANGE = new Set([
    "properties",
    "patternProperties",
    "enum",
    "dependencies",
    "definitions"
  ]);
  function getJsonPointer(parsedRef, { baseId, schema, root }) {
    var _a;
    if (((_a = parsedRef.fragment) === null || _a === undefined ? undefined : _a[0]) !== "/")
      return;
    for (const part of parsedRef.fragment.slice(1).split("/")) {
      if (typeof schema === "boolean")
        return;
      const partSchema = schema[(0, util_1.unescapeFragment)(part)];
      if (partSchema === undefined)
        return;
      schema = partSchema;
      const schId = typeof schema === "object" && schema[this.opts.schemaId];
      if (!PREVENT_SCOPE_CHANGE.has(part) && schId) {
        baseId = (0, resolve_1.resolveUrl)(this.opts.uriResolver, baseId, schId);
      }
    }
    let env;
    if (typeof schema != "boolean" && schema.$ref && !(0, util_1.schemaHasRulesButRef)(schema, this.RULES)) {
      const $ref = (0, resolve_1.resolveUrl)(this.opts.uriResolver, baseId, schema.$ref);
      env = resolveSchema.call(this, root, $ref);
    }
    const { schemaId } = this.opts;
    env = env || new SchemaEnv({ schema, schemaId, root, baseId });
    if (env.schema !== env.root.schema)
      return env;
    return;
  }
});

// node_modules/.pnpm/ajv@8.17.1/node_modules/ajv/dist/refs/data.json
var require_data = __commonJS((exports, module) => {
  module.exports = {
    $id: "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#",
    description: "Meta-schema for $data reference (JSON AnySchema extension proposal)",
    type: "object",
    required: ["$data"],
    properties: {
      $data: {
        type: "string",
        anyOf: [{ format: "relative-json-pointer" }, { format: "json-pointer" }]
      }
    },
    additionalProperties: false
  };
});

// node_modules/.pnpm/fast-uri@3.0.6/node_modules/fast-uri/lib/scopedChars.js
var require_scopedChars = __commonJS((exports, module) => {
  var HEX = {
    0: 0,
    1: 1,
    2: 2,
    3: 3,
    4: 4,
    5: 5,
    6: 6,
    7: 7,
    8: 8,
    9: 9,
    a: 10,
    A: 10,
    b: 11,
    B: 11,
    c: 12,
    C: 12,
    d: 13,
    D: 13,
    e: 14,
    E: 14,
    f: 15,
    F: 15
  };
  module.exports = {
    HEX
  };
});

// node_modules/.pnpm/fast-uri@3.0.6/node_modules/fast-uri/lib/utils.js
var require_utils = __commonJS((exports, module) => {
  var { HEX } = require_scopedChars();
  var IPV4_REG = /^(?:(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]\d|\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]\d|\d)$/u;
  function normalizeIPv4(host) {
    if (findToken(host, ".") < 3) {
      return { host, isIPV4: false };
    }
    const matches = host.match(IPV4_REG) || [];
    const [address] = matches;
    if (address) {
      return { host: stripLeadingZeros(address, "."), isIPV4: true };
    } else {
      return { host, isIPV4: false };
    }
  }
  function stringArrayToHexStripped(input, keepZero = false) {
    let acc = "";
    let strip = true;
    for (const c of input) {
      if (HEX[c] === undefined)
        return;
      if (c !== "0" && strip === true)
        strip = false;
      if (!strip)
        acc += c;
    }
    if (keepZero && acc.length === 0)
      acc = "0";
    return acc;
  }
  function getIPV6(input) {
    let tokenCount = 0;
    const output = { error: false, address: "", zone: "" };
    const address = [];
    const buffer = [];
    let isZone = false;
    let endipv6Encountered = false;
    let endIpv6 = false;
    function consume() {
      if (buffer.length) {
        if (isZone === false) {
          const hex = stringArrayToHexStripped(buffer);
          if (hex !== undefined) {
            address.push(hex);
          } else {
            output.error = true;
            return false;
          }
        }
        buffer.length = 0;
      }
      return true;
    }
    for (let i = 0;i < input.length; i++) {
      const cursor = input[i];
      if (cursor === "[" || cursor === "]") {
        continue;
      }
      if (cursor === ":") {
        if (endipv6Encountered === true) {
          endIpv6 = true;
        }
        if (!consume()) {
          break;
        }
        tokenCount++;
        address.push(":");
        if (tokenCount > 7) {
          output.error = true;
          break;
        }
        if (i - 1 >= 0 && input[i - 1] === ":") {
          endipv6Encountered = true;
        }
        continue;
      } else if (cursor === "%") {
        if (!consume()) {
          break;
        }
        isZone = true;
      } else {
        buffer.push(cursor);
        continue;
      }
    }
    if (buffer.length) {
      if (isZone) {
        output.zone = buffer.join("");
      } else if (endIpv6) {
        address.push(buffer.join(""));
      } else {
        address.push(stringArrayToHexStripped(buffer));
      }
    }
    output.address = address.join("");
    return output;
  }
  function normalizeIPv6(host) {
    if (findToken(host, ":") < 2) {
      return { host, isIPV6: false };
    }
    const ipv6 = getIPV6(host);
    if (!ipv6.error) {
      let newHost = ipv6.address;
      let escapedHost = ipv6.address;
      if (ipv6.zone) {
        newHost += "%" + ipv6.zone;
        escapedHost += "%25" + ipv6.zone;
      }
      return { host: newHost, escapedHost, isIPV6: true };
    } else {
      return { host, isIPV6: false };
    }
  }
  function stripLeadingZeros(str, token) {
    let out = "";
    let skip = true;
    const l = str.length;
    for (let i = 0;i < l; i++) {
      const c = str[i];
      if (c === "0" && skip) {
        if (i + 1 <= l && str[i + 1] === token || i + 1 === l) {
          out += c;
          skip = false;
        }
      } else {
        if (c === token) {
          skip = true;
        } else {
          skip = false;
        }
        out += c;
      }
    }
    return out;
  }
  function findToken(str, token) {
    let ind = 0;
    for (let i = 0;i < str.length; i++) {
      if (str[i] === token)
        ind++;
    }
    return ind;
  }
  var RDS1 = /^\.\.?\//u;
  var RDS2 = /^\/\.(?:\/|$)/u;
  var RDS3 = /^\/\.\.(?:\/|$)/u;
  var RDS5 = /^\/?(?:.|\n)*?(?=\/|$)/u;
  function removeDotSegments(input) {
    const output = [];
    while (input.length) {
      if (input.match(RDS1)) {
        input = input.replace(RDS1, "");
      } else if (input.match(RDS2)) {
        input = input.replace(RDS2, "/");
      } else if (input.match(RDS3)) {
        input = input.replace(RDS3, "/");
        output.pop();
      } else if (input === "." || input === "..") {
        input = "";
      } else {
        const im = input.match(RDS5);
        if (im) {
          const s = im[0];
          input = input.slice(s.length);
          output.push(s);
        } else {
          throw new Error("Unexpected dot segment condition");
        }
      }
    }
    return output.join("");
  }
  function normalizeComponentEncoding(components, esc) {
    const func = esc !== true ? escape : unescape;
    if (components.scheme !== undefined) {
      components.scheme = func(components.scheme);
    }
    if (components.userinfo !== undefined) {
      components.userinfo = func(components.userinfo);
    }
    if (components.host !== undefined) {
      components.host = func(components.host);
    }
    if (components.path !== undefined) {
      components.path = func(components.path);
    }
    if (components.query !== undefined) {
      components.query = func(components.query);
    }
    if (components.fragment !== undefined) {
      components.fragment = func(components.fragment);
    }
    return components;
  }
  function recomposeAuthority(components) {
    const uriTokens = [];
    if (components.userinfo !== undefined) {
      uriTokens.push(components.userinfo);
      uriTokens.push("@");
    }
    if (components.host !== undefined) {
      let host = unescape(components.host);
      const ipV4res = normalizeIPv4(host);
      if (ipV4res.isIPV4) {
        host = ipV4res.host;
      } else {
        const ipV6res = normalizeIPv6(ipV4res.host);
        if (ipV6res.isIPV6 === true) {
          host = `[${ipV6res.escapedHost}]`;
        } else {
          host = components.host;
        }
      }
      uriTokens.push(host);
    }
    if (typeof components.port === "number" || typeof components.port === "string") {
      uriTokens.push(":");
      uriTokens.push(String(components.port));
    }
    return uriTokens.length ? uriTokens.join("") : undefined;
  }
  module.exports = {
    recomposeAuthority,
    normalizeComponentEncoding,
    removeDotSegments,
    normalizeIPv4,
    normalizeIPv6,
    stringArrayToHexStripped
  };
});

// node_modules/.pnpm/fast-uri@3.0.6/node_modules/fast-uri/lib/schemes.js
var require_schemes = __commonJS((exports, module) => {
  var UUID_REG = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/iu;
  var URN_REG = /([\da-z][\d\-a-z]{0,31}):((?:[\w!$'()*+,\-.:;=@]|%[\da-f]{2})+)/iu;
  function isSecure(wsComponents) {
    return typeof wsComponents.secure === "boolean" ? wsComponents.secure : String(wsComponents.scheme).toLowerCase() === "wss";
  }
  function httpParse(components) {
    if (!components.host) {
      components.error = components.error || "HTTP URIs must have a host.";
    }
    return components;
  }
  function httpSerialize(components) {
    const secure = String(components.scheme).toLowerCase() === "https";
    if (components.port === (secure ? 443 : 80) || components.port === "") {
      components.port = undefined;
    }
    if (!components.path) {
      components.path = "/";
    }
    return components;
  }
  function wsParse(wsComponents) {
    wsComponents.secure = isSecure(wsComponents);
    wsComponents.resourceName = (wsComponents.path || "/") + (wsComponents.query ? "?" + wsComponents.query : "");
    wsComponents.path = undefined;
    wsComponents.query = undefined;
    return wsComponents;
  }
  function wsSerialize(wsComponents) {
    if (wsComponents.port === (isSecure(wsComponents) ? 443 : 80) || wsComponents.port === "") {
      wsComponents.port = undefined;
    }
    if (typeof wsComponents.secure === "boolean") {
      wsComponents.scheme = wsComponents.secure ? "wss" : "ws";
      wsComponents.secure = undefined;
    }
    if (wsComponents.resourceName) {
      const [path, query] = wsComponents.resourceName.split("?");
      wsComponents.path = path && path !== "/" ? path : undefined;
      wsComponents.query = query;
      wsComponents.resourceName = undefined;
    }
    wsComponents.fragment = undefined;
    return wsComponents;
  }
  function urnParse(urnComponents, options) {
    if (!urnComponents.path) {
      urnComponents.error = "URN can not be parsed";
      return urnComponents;
    }
    const matches = urnComponents.path.match(URN_REG);
    if (matches) {
      const scheme = options.scheme || urnComponents.scheme || "urn";
      urnComponents.nid = matches[1].toLowerCase();
      urnComponents.nss = matches[2];
      const urnScheme = `${scheme}:${options.nid || urnComponents.nid}`;
      const schemeHandler = SCHEMES[urnScheme];
      urnComponents.path = undefined;
      if (schemeHandler) {
        urnComponents = schemeHandler.parse(urnComponents, options);
      }
    } else {
      urnComponents.error = urnComponents.error || "URN can not be parsed.";
    }
    return urnComponents;
  }
  function urnSerialize(urnComponents, options) {
    const scheme = options.scheme || urnComponents.scheme || "urn";
    const nid = urnComponents.nid.toLowerCase();
    const urnScheme = `${scheme}:${options.nid || nid}`;
    const schemeHandler = SCHEMES[urnScheme];
    if (schemeHandler) {
      urnComponents = schemeHandler.serialize(urnComponents, options);
    }
    const uriComponents = urnComponents;
    const nss = urnComponents.nss;
    uriComponents.path = `${nid || options.nid}:${nss}`;
    options.skipEscape = true;
    return uriComponents;
  }
  function urnuuidParse(urnComponents, options) {
    const uuidComponents = urnComponents;
    uuidComponents.uuid = uuidComponents.nss;
    uuidComponents.nss = undefined;
    if (!options.tolerant && (!uuidComponents.uuid || !UUID_REG.test(uuidComponents.uuid))) {
      uuidComponents.error = uuidComponents.error || "UUID is not valid.";
    }
    return uuidComponents;
  }
  function urnuuidSerialize(uuidComponents) {
    const urnComponents = uuidComponents;
    urnComponents.nss = (uuidComponents.uuid || "").toLowerCase();
    return urnComponents;
  }
  var http = {
    scheme: "http",
    domainHost: true,
    parse: httpParse,
    serialize: httpSerialize
  };
  var https = {
    scheme: "https",
    domainHost: http.domainHost,
    parse: httpParse,
    serialize: httpSerialize
  };
  var ws = {
    scheme: "ws",
    domainHost: true,
    parse: wsParse,
    serialize: wsSerialize
  };
  var wss = {
    scheme: "wss",
    domainHost: ws.domainHost,
    parse: ws.parse,
    serialize: ws.serialize
  };
  var urn = {
    scheme: "urn",
    parse: urnParse,
    serialize: urnSerialize,
    skipNormalize: true
  };
  var urnuuid = {
    scheme: "urn:uuid",
    parse: urnuuidParse,
    serialize: urnuuidSerialize,
    skipNormalize: true
  };
  var SCHEMES = {
    http,
    https,
    ws,
    wss,
    urn,
    "urn:uuid": urnuuid
  };
  module.exports = SCHEMES;
});

// node_modules/.pnpm/fast-uri@3.0.6/node_modules/fast-uri/index.js
var require_fast_uri = __commonJS((exports, module) => {
  var { normalizeIPv6, normalizeIPv4, removeDotSegments, recomposeAuthority, normalizeComponentEncoding } = require_utils();
  var SCHEMES = require_schemes();
  function normalize(uri, options) {
    if (typeof uri === "string") {
      uri = serialize(parse(uri, options), options);
    } else if (typeof uri === "object") {
      uri = parse(serialize(uri, options), options);
    }
    return uri;
  }
  function resolve(baseURI, relativeURI, options) {
    const schemelessOptions = Object.assign({ scheme: "null" }, options);
    const resolved = resolveComponents(parse(baseURI, schemelessOptions), parse(relativeURI, schemelessOptions), schemelessOptions, true);
    return serialize(resolved, { ...schemelessOptions, skipEscape: true });
  }
  function resolveComponents(base, relative, options, skipNormalization) {
    const target = {};
    if (!skipNormalization) {
      base = parse(serialize(base, options), options);
      relative = parse(serialize(relative, options), options);
    }
    options = options || {};
    if (!options.tolerant && relative.scheme) {
      target.scheme = relative.scheme;
      target.userinfo = relative.userinfo;
      target.host = relative.host;
      target.port = relative.port;
      target.path = removeDotSegments(relative.path || "");
      target.query = relative.query;
    } else {
      if (relative.userinfo !== undefined || relative.host !== undefined || relative.port !== undefined) {
        target.userinfo = relative.userinfo;
        target.host = relative.host;
        target.port = relative.port;
        target.path = removeDotSegments(relative.path || "");
        target.query = relative.query;
      } else {
        if (!relative.path) {
          target.path = base.path;
          if (relative.query !== undefined) {
            target.query = relative.query;
          } else {
            target.query = base.query;
          }
        } else {
          if (relative.path.charAt(0) === "/") {
            target.path = removeDotSegments(relative.path);
          } else {
            if ((base.userinfo !== undefined || base.host !== undefined || base.port !== undefined) && !base.path) {
              target.path = "/" + relative.path;
            } else if (!base.path) {
              target.path = relative.path;
            } else {
              target.path = base.path.slice(0, base.path.lastIndexOf("/") + 1) + relative.path;
            }
            target.path = removeDotSegments(target.path);
          }
          target.query = relative.query;
        }
        target.userinfo = base.userinfo;
        target.host = base.host;
        target.port = base.port;
      }
      target.scheme = base.scheme;
    }
    target.fragment = relative.fragment;
    return target;
  }
  function equal(uriA, uriB, options) {
    if (typeof uriA === "string") {
      uriA = unescape(uriA);
      uriA = serialize(normalizeComponentEncoding(parse(uriA, options), true), { ...options, skipEscape: true });
    } else if (typeof uriA === "object") {
      uriA = serialize(normalizeComponentEncoding(uriA, true), { ...options, skipEscape: true });
    }
    if (typeof uriB === "string") {
      uriB = unescape(uriB);
      uriB = serialize(normalizeComponentEncoding(parse(uriB, options), true), { ...options, skipEscape: true });
    } else if (typeof uriB === "object") {
      uriB = serialize(normalizeComponentEncoding(uriB, true), { ...options, skipEscape: true });
    }
    return uriA.toLowerCase() === uriB.toLowerCase();
  }
  function serialize(cmpts, opts) {
    const components = {
      host: cmpts.host,
      scheme: cmpts.scheme,
      userinfo: cmpts.userinfo,
      port: cmpts.port,
      path: cmpts.path,
      query: cmpts.query,
      nid: cmpts.nid,
      nss: cmpts.nss,
      uuid: cmpts.uuid,
      fragment: cmpts.fragment,
      reference: cmpts.reference,
      resourceName: cmpts.resourceName,
      secure: cmpts.secure,
      error: ""
    };
    const options = Object.assign({}, opts);
    const uriTokens = [];
    const schemeHandler = SCHEMES[(options.scheme || components.scheme || "").toLowerCase()];
    if (schemeHandler && schemeHandler.serialize)
      schemeHandler.serialize(components, options);
    if (components.path !== undefined) {
      if (!options.skipEscape) {
        components.path = escape(components.path);
        if (components.scheme !== undefined) {
          components.path = components.path.split("%3A").join(":");
        }
      } else {
        components.path = unescape(components.path);
      }
    }
    if (options.reference !== "suffix" && components.scheme) {
      uriTokens.push(components.scheme, ":");
    }
    const authority = recomposeAuthority(components);
    if (authority !== undefined) {
      if (options.reference !== "suffix") {
        uriTokens.push("//");
      }
      uriTokens.push(authority);
      if (components.path && components.path.charAt(0) !== "/") {
        uriTokens.push("/");
      }
    }
    if (components.path !== undefined) {
      let s = components.path;
      if (!options.absolutePath && (!schemeHandler || !schemeHandler.absolutePath)) {
        s = removeDotSegments(s);
      }
      if (authority === undefined) {
        s = s.replace(/^\/\//u, "/%2F");
      }
      uriTokens.push(s);
    }
    if (components.query !== undefined) {
      uriTokens.push("?", components.query);
    }
    if (components.fragment !== undefined) {
      uriTokens.push("#", components.fragment);
    }
    return uriTokens.join("");
  }
  var hexLookUp = Array.from({ length: 127 }, (_v, k) => /[^!"$&'()*+,\-.;=_`a-z{}~]/u.test(String.fromCharCode(k)));
  function nonSimpleDomain(value) {
    let code = 0;
    for (let i = 0, len = value.length;i < len; ++i) {
      code = value.charCodeAt(i);
      if (code > 126 || hexLookUp[code]) {
        return true;
      }
    }
    return false;
  }
  var URI_PARSE = /^(?:([^#/:?]+):)?(?:\/\/((?:([^#/?@]*)@)?(\[[^#/?\]]+\]|[^#/:?]*)(?::(\d*))?))?([^#?]*)(?:\?([^#]*))?(?:#((?:.|[\n\r])*))?/u;
  function parse(uri, opts) {
    const options = Object.assign({}, opts);
    const parsed = {
      scheme: undefined,
      userinfo: undefined,
      host: "",
      port: undefined,
      path: "",
      query: undefined,
      fragment: undefined
    };
    const gotEncoding = uri.indexOf("%") !== -1;
    let isIP = false;
    if (options.reference === "suffix")
      uri = (options.scheme ? options.scheme + ":" : "") + "//" + uri;
    const matches = uri.match(URI_PARSE);
    if (matches) {
      parsed.scheme = matches[1];
      parsed.userinfo = matches[3];
      parsed.host = matches[4];
      parsed.port = parseInt(matches[5], 10);
      parsed.path = matches[6] || "";
      parsed.query = matches[7];
      parsed.fragment = matches[8];
      if (isNaN(parsed.port)) {
        parsed.port = matches[5];
      }
      if (parsed.host) {
        const ipv4result = normalizeIPv4(parsed.host);
        if (ipv4result.isIPV4 === false) {
          const ipv6result = normalizeIPv6(ipv4result.host);
          parsed.host = ipv6result.host.toLowerCase();
          isIP = ipv6result.isIPV6;
        } else {
          parsed.host = ipv4result.host;
          isIP = true;
        }
      }
      if (parsed.scheme === undefined && parsed.userinfo === undefined && parsed.host === undefined && parsed.port === undefined && parsed.query === undefined && !parsed.path) {
        parsed.reference = "same-document";
      } else if (parsed.scheme === undefined) {
        parsed.reference = "relative";
      } else if (parsed.fragment === undefined) {
        parsed.reference = "absolute";
      } else {
        parsed.reference = "uri";
      }
      if (options.reference && options.reference !== "suffix" && options.reference !== parsed.reference) {
        parsed.error = parsed.error || "URI is not a " + options.reference + " reference.";
      }
      const schemeHandler = SCHEMES[(options.scheme || parsed.scheme || "").toLowerCase()];
      if (!options.unicodeSupport && (!schemeHandler || !schemeHandler.unicodeSupport)) {
        if (parsed.host && (options.domainHost || schemeHandler && schemeHandler.domainHost) && isIP === false && nonSimpleDomain(parsed.host)) {
          try {
            parsed.host = URL.domainToASCII(parsed.host.toLowerCase());
          } catch (e) {
            parsed.error = parsed.error || "Host's domain name can not be converted to ASCII: " + e;
          }
        }
      }
      if (!schemeHandler || schemeHandler && !schemeHandler.skipNormalize) {
        if (gotEncoding && parsed.scheme !== undefined) {
          parsed.scheme = unescape(parsed.scheme);
        }
        if (gotEncoding && parsed.host !== undefined) {
          parsed.host = unescape(parsed.host);
        }
        if (parsed.path) {
          parsed.path = escape(unescape(parsed.path));
        }
        if (parsed.fragment) {
          parsed.fragment = encodeURI(decodeURIComponent(parsed.fragment));
        }
      }
      if (schemeHandler && schemeHandler.parse) {
        schemeHandler.parse(parsed, options);
      }
    } else {
      parsed.error = parsed.error || "URI can not be parsed.";
    }
    return parsed;
  }
  var fastUri = {
    SCHEMES,
    normalize,
    resolve,
    resolveComponents,
    equal,
    serialize,
    parse
  };
  module.exports = fastUri;
  module.exports.default = fastUri;
  module.exports.fastUri = fastUri;
});

// node_modules/.pnpm/ajv@8.17.1/node_modules/ajv/dist/runtime/uri.js
var require_uri = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var uri = require_fast_uri();
  uri.code = 'require("ajv/dist/runtime/uri").default';
  exports.default = uri;
});

// node_modules/.pnpm/ajv@8.17.1/node_modules/ajv/dist/core.js
var require_core = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.CodeGen = exports.Name = exports.nil = exports.stringify = exports.str = exports._ = exports.KeywordCxt = undefined;
  var validate_1 = require_validate();
  Object.defineProperty(exports, "KeywordCxt", { enumerable: true, get: function() {
    return validate_1.KeywordCxt;
  } });
  var codegen_1 = require_codegen();
  Object.defineProperty(exports, "_", { enumerable: true, get: function() {
    return codegen_1._;
  } });
  Object.defineProperty(exports, "str", { enumerable: true, get: function() {
    return codegen_1.str;
  } });
  Object.defineProperty(exports, "stringify", { enumerable: true, get: function() {
    return codegen_1.stringify;
  } });
  Object.defineProperty(exports, "nil", { enumerable: true, get: function() {
    return codegen_1.nil;
  } });
  Object.defineProperty(exports, "Name", { enumerable: true, get: function() {
    return codegen_1.Name;
  } });
  Object.defineProperty(exports, "CodeGen", { enumerable: true, get: function() {
    return codegen_1.CodeGen;
  } });
  var validation_error_1 = require_validation_error();
  var ref_error_1 = require_ref_error();
  var rules_1 = require_rules();
  var compile_1 = require_compile();
  var codegen_2 = require_codegen();
  var resolve_1 = require_resolve();
  var dataType_1 = require_dataType();
  var util_1 = require_util();
  var $dataRefSchema = require_data();
  var uri_1 = require_uri();
  var defaultRegExp = (str, flags) => new RegExp(str, flags);
  defaultRegExp.code = "new RegExp";
  var META_IGNORE_OPTIONS = ["removeAdditional", "useDefaults", "coerceTypes"];
  var EXT_SCOPE_NAMES = new Set([
    "validate",
    "serialize",
    "parse",
    "wrapper",
    "root",
    "schema",
    "keyword",
    "pattern",
    "formats",
    "validate$data",
    "func",
    "obj",
    "Error"
  ]);
  var removedOptions = {
    errorDataPath: "",
    format: "`validateFormats: false` can be used instead.",
    nullable: '"nullable" keyword is supported by default.',
    jsonPointers: "Deprecated jsPropertySyntax can be used instead.",
    extendRefs: "Deprecated ignoreKeywordsWithRef can be used instead.",
    missingRefs: "Pass empty schema with $id that should be ignored to ajv.addSchema.",
    processCode: "Use option `code: {process: (code, schemaEnv: object) => string}`",
    sourceCode: "Use option `code: {source: true}`",
    strictDefaults: "It is default now, see option `strict`.",
    strictKeywords: "It is default now, see option `strict`.",
    uniqueItems: '"uniqueItems" keyword is always validated.',
    unknownFormats: "Disable strict mode or pass `true` to `ajv.addFormat` (or `formats` option).",
    cache: "Map is used as cache, schema object as key.",
    serialize: "Map is used as cache, schema object as key.",
    ajvErrors: "It is default now."
  };
  var deprecatedOptions = {
    ignoreKeywordsWithRef: "",
    jsPropertySyntax: "",
    unicode: '"minLength"/"maxLength" account for unicode characters by default.'
  };
  var MAX_EXPRESSION = 200;
  function requiredOptions(o) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0;
    const s = o.strict;
    const _optz = (_a = o.code) === null || _a === undefined ? undefined : _a.optimize;
    const optimize = _optz === true || _optz === undefined ? 1 : _optz || 0;
    const regExp = (_c = (_b = o.code) === null || _b === undefined ? undefined : _b.regExp) !== null && _c !== undefined ? _c : defaultRegExp;
    const uriResolver = (_d = o.uriResolver) !== null && _d !== undefined ? _d : uri_1.default;
    return {
      strictSchema: (_f = (_e = o.strictSchema) !== null && _e !== undefined ? _e : s) !== null && _f !== undefined ? _f : true,
      strictNumbers: (_h = (_g = o.strictNumbers) !== null && _g !== undefined ? _g : s) !== null && _h !== undefined ? _h : true,
      strictTypes: (_k = (_j = o.strictTypes) !== null && _j !== undefined ? _j : s) !== null && _k !== undefined ? _k : "log",
      strictTuples: (_m = (_l = o.strictTuples) !== null && _l !== undefined ? _l : s) !== null && _m !== undefined ? _m : "log",
      strictRequired: (_p = (_o = o.strictRequired) !== null && _o !== undefined ? _o : s) !== null && _p !== undefined ? _p : false,
      code: o.code ? { ...o.code, optimize, regExp } : { optimize, regExp },
      loopRequired: (_q = o.loopRequired) !== null && _q !== undefined ? _q : MAX_EXPRESSION,
      loopEnum: (_r = o.loopEnum) !== null && _r !== undefined ? _r : MAX_EXPRESSION,
      meta: (_s = o.meta) !== null && _s !== undefined ? _s : true,
      messages: (_t = o.messages) !== null && _t !== undefined ? _t : true,
      inlineRefs: (_u = o.inlineRefs) !== null && _u !== undefined ? _u : true,
      schemaId: (_v = o.schemaId) !== null && _v !== undefined ? _v : "$id",
      addUsedSchema: (_w = o.addUsedSchema) !== null && _w !== undefined ? _w : true,
      validateSchema: (_x = o.validateSchema) !== null && _x !== undefined ? _x : true,
      validateFormats: (_y = o.validateFormats) !== null && _y !== undefined ? _y : true,
      unicodeRegExp: (_z = o.unicodeRegExp) !== null && _z !== undefined ? _z : true,
      int32range: (_0 = o.int32range) !== null && _0 !== undefined ? _0 : true,
      uriResolver
    };
  }

  class Ajv {
    constructor(opts = {}) {
      this.schemas = {};
      this.refs = {};
      this.formats = {};
      this._compilations = new Set;
      this._loading = {};
      this._cache = new Map;
      opts = this.opts = { ...opts, ...requiredOptions(opts) };
      const { es5, lines } = this.opts.code;
      this.scope = new codegen_2.ValueScope({ scope: {}, prefixes: EXT_SCOPE_NAMES, es5, lines });
      this.logger = getLogger(opts.logger);
      const formatOpt = opts.validateFormats;
      opts.validateFormats = false;
      this.RULES = (0, rules_1.getRules)();
      checkOptions.call(this, removedOptions, opts, "NOT SUPPORTED");
      checkOptions.call(this, deprecatedOptions, opts, "DEPRECATED", "warn");
      this._metaOpts = getMetaSchemaOptions.call(this);
      if (opts.formats)
        addInitialFormats.call(this);
      this._addVocabularies();
      this._addDefaultMetaSchema();
      if (opts.keywords)
        addInitialKeywords.call(this, opts.keywords);
      if (typeof opts.meta == "object")
        this.addMetaSchema(opts.meta);
      addInitialSchemas.call(this);
      opts.validateFormats = formatOpt;
    }
    _addVocabularies() {
      this.addKeyword("$async");
    }
    _addDefaultMetaSchema() {
      const { $data, meta, schemaId } = this.opts;
      let _dataRefSchema = $dataRefSchema;
      if (schemaId === "id") {
        _dataRefSchema = { ...$dataRefSchema };
        _dataRefSchema.id = _dataRefSchema.$id;
        delete _dataRefSchema.$id;
      }
      if (meta && $data)
        this.addMetaSchema(_dataRefSchema, _dataRefSchema[schemaId], false);
    }
    defaultMeta() {
      const { meta, schemaId } = this.opts;
      return this.opts.defaultMeta = typeof meta == "object" ? meta[schemaId] || meta : undefined;
    }
    validate(schemaKeyRef, data) {
      let v;
      if (typeof schemaKeyRef == "string") {
        v = this.getSchema(schemaKeyRef);
        if (!v)
          throw new Error(`no schema with key or ref "${schemaKeyRef}"`);
      } else {
        v = this.compile(schemaKeyRef);
      }
      const valid = v(data);
      if (!("$async" in v))
        this.errors = v.errors;
      return valid;
    }
    compile(schema, _meta) {
      const sch = this._addSchema(schema, _meta);
      return sch.validate || this._compileSchemaEnv(sch);
    }
    compileAsync(schema, meta) {
      if (typeof this.opts.loadSchema != "function") {
        throw new Error("options.loadSchema should be a function");
      }
      const { loadSchema } = this.opts;
      return runCompileAsync.call(this, schema, meta);
      async function runCompileAsync(_schema, _meta) {
        await loadMetaSchema.call(this, _schema.$schema);
        const sch = this._addSchema(_schema, _meta);
        return sch.validate || _compileAsync.call(this, sch);
      }
      async function loadMetaSchema($ref) {
        if ($ref && !this.getSchema($ref)) {
          await runCompileAsync.call(this, { $ref }, true);
        }
      }
      async function _compileAsync(sch) {
        try {
          return this._compileSchemaEnv(sch);
        } catch (e) {
          if (!(e instanceof ref_error_1.default))
            throw e;
          checkLoaded.call(this, e);
          await loadMissingSchema.call(this, e.missingSchema);
          return _compileAsync.call(this, sch);
        }
      }
      function checkLoaded({ missingSchema: ref, missingRef }) {
        if (this.refs[ref]) {
          throw new Error(`AnySchema ${ref} is loaded but ${missingRef} cannot be resolved`);
        }
      }
      async function loadMissingSchema(ref) {
        const _schema = await _loadSchema.call(this, ref);
        if (!this.refs[ref])
          await loadMetaSchema.call(this, _schema.$schema);
        if (!this.refs[ref])
          this.addSchema(_schema, ref, meta);
      }
      async function _loadSchema(ref) {
        const p = this._loading[ref];
        if (p)
          return p;
        try {
          return await (this._loading[ref] = loadSchema(ref));
        } finally {
          delete this._loading[ref];
        }
      }
    }
    addSchema(schema, key, _meta, _validateSchema = this.opts.validateSchema) {
      if (Array.isArray(schema)) {
        for (const sch of schema)
          this.addSchema(sch, undefined, _meta, _validateSchema);
        return this;
      }
      let id;
      if (typeof schema === "object") {
        const { schemaId } = this.opts;
        id = schema[schemaId];
        if (id !== undefined && typeof id != "string") {
          throw new Error(`schema ${schemaId} must be string`);
        }
      }
      key = (0, resolve_1.normalizeId)(key || id);
      this._checkUnique(key);
      this.schemas[key] = this._addSchema(schema, _meta, key, _validateSchema, true);
      return this;
    }
    addMetaSchema(schema, key, _validateSchema = this.opts.validateSchema) {
      this.addSchema(schema, key, true, _validateSchema);
      return this;
    }
    validateSchema(schema, throwOrLogError) {
      if (typeof schema == "boolean")
        return true;
      let $schema;
      $schema = schema.$schema;
      if ($schema !== undefined && typeof $schema != "string") {
        throw new Error("$schema must be a string");
      }
      $schema = $schema || this.opts.defaultMeta || this.defaultMeta();
      if (!$schema) {
        this.logger.warn("meta-schema not available");
        this.errors = null;
        return true;
      }
      const valid = this.validate($schema, schema);
      if (!valid && throwOrLogError) {
        const message = "schema is invalid: " + this.errorsText();
        if (this.opts.validateSchema === "log")
          this.logger.error(message);
        else
          throw new Error(message);
      }
      return valid;
    }
    getSchema(keyRef) {
      let sch;
      while (typeof (sch = getSchEnv.call(this, keyRef)) == "string")
        keyRef = sch;
      if (sch === undefined) {
        const { schemaId } = this.opts;
        const root = new compile_1.SchemaEnv({ schema: {}, schemaId });
        sch = compile_1.resolveSchema.call(this, root, keyRef);
        if (!sch)
          return;
        this.refs[keyRef] = sch;
      }
      return sch.validate || this._compileSchemaEnv(sch);
    }
    removeSchema(schemaKeyRef) {
      if (schemaKeyRef instanceof RegExp) {
        this._removeAllSchemas(this.schemas, schemaKeyRef);
        this._removeAllSchemas(this.refs, schemaKeyRef);
        return this;
      }
      switch (typeof schemaKeyRef) {
        case "undefined":
          this._removeAllSchemas(this.schemas);
          this._removeAllSchemas(this.refs);
          this._cache.clear();
          return this;
        case "string": {
          const sch = getSchEnv.call(this, schemaKeyRef);
          if (typeof sch == "object")
            this._cache.delete(sch.schema);
          delete this.schemas[schemaKeyRef];
          delete this.refs[schemaKeyRef];
          return this;
        }
        case "object": {
          const cacheKey = schemaKeyRef;
          this._cache.delete(cacheKey);
          let id = schemaKeyRef[this.opts.schemaId];
          if (id) {
            id = (0, resolve_1.normalizeId)(id);
            delete this.schemas[id];
            delete this.refs[id];
          }
          return this;
        }
        default:
          throw new Error("ajv.removeSchema: invalid parameter");
      }
    }
    addVocabulary(definitions) {
      for (const def of definitions)
        this.addKeyword(def);
      return this;
    }
    addKeyword(kwdOrDef, def) {
      let keyword;
      if (typeof kwdOrDef == "string") {
        keyword = kwdOrDef;
        if (typeof def == "object") {
          this.logger.warn("these parameters are deprecated, see docs for addKeyword");
          def.keyword = keyword;
        }
      } else if (typeof kwdOrDef == "object" && def === undefined) {
        def = kwdOrDef;
        keyword = def.keyword;
        if (Array.isArray(keyword) && !keyword.length) {
          throw new Error("addKeywords: keyword must be string or non-empty array");
        }
      } else {
        throw new Error("invalid addKeywords parameters");
      }
      checkKeyword.call(this, keyword, def);
      if (!def) {
        (0, util_1.eachItem)(keyword, (kwd) => addRule.call(this, kwd));
        return this;
      }
      keywordMetaschema.call(this, def);
      const definition = {
        ...def,
        type: (0, dataType_1.getJSONTypes)(def.type),
        schemaType: (0, dataType_1.getJSONTypes)(def.schemaType)
      };
      (0, util_1.eachItem)(keyword, definition.type.length === 0 ? (k) => addRule.call(this, k, definition) : (k) => definition.type.forEach((t) => addRule.call(this, k, definition, t)));
      return this;
    }
    getKeyword(keyword) {
      const rule = this.RULES.all[keyword];
      return typeof rule == "object" ? rule.definition : !!rule;
    }
    removeKeyword(keyword) {
      const { RULES } = this;
      delete RULES.keywords[keyword];
      delete RULES.all[keyword];
      for (const group of RULES.rules) {
        const i = group.rules.findIndex((rule) => rule.keyword === keyword);
        if (i >= 0)
          group.rules.splice(i, 1);
      }
      return this;
    }
    addFormat(name, format) {
      if (typeof format == "string")
        format = new RegExp(format);
      this.formats[name] = format;
      return this;
    }
    errorsText(errors = this.errors, { separator = ", ", dataVar = "data" } = {}) {
      if (!errors || errors.length === 0)
        return "No errors";
      return errors.map((e) => `${dataVar}${e.instancePath} ${e.message}`).reduce((text, msg) => text + separator + msg);
    }
    $dataMetaSchema(metaSchema, keywordsJsonPointers) {
      const rules = this.RULES.all;
      metaSchema = JSON.parse(JSON.stringify(metaSchema));
      for (const jsonPointer of keywordsJsonPointers) {
        const segments = jsonPointer.split("/").slice(1);
        let keywords = metaSchema;
        for (const seg of segments)
          keywords = keywords[seg];
        for (const key in rules) {
          const rule = rules[key];
          if (typeof rule != "object")
            continue;
          const { $data } = rule.definition;
          const schema = keywords[key];
          if ($data && schema)
            keywords[key] = schemaOrData(schema);
        }
      }
      return metaSchema;
    }
    _removeAllSchemas(schemas, regex) {
      for (const keyRef in schemas) {
        const sch = schemas[keyRef];
        if (!regex || regex.test(keyRef)) {
          if (typeof sch == "string") {
            delete schemas[keyRef];
          } else if (sch && !sch.meta) {
            this._cache.delete(sch.schema);
            delete schemas[keyRef];
          }
        }
      }
    }
    _addSchema(schema, meta, baseId, validateSchema = this.opts.validateSchema, addSchema = this.opts.addUsedSchema) {
      let id;
      const { schemaId } = this.opts;
      if (typeof schema == "object") {
        id = schema[schemaId];
      } else {
        if (this.opts.jtd)
          throw new Error("schema must be object");
        else if (typeof schema != "boolean")
          throw new Error("schema must be object or boolean");
      }
      let sch = this._cache.get(schema);
      if (sch !== undefined)
        return sch;
      baseId = (0, resolve_1.normalizeId)(id || baseId);
      const localRefs = resolve_1.getSchemaRefs.call(this, schema, baseId);
      sch = new compile_1.SchemaEnv({ schema, schemaId, meta, baseId, localRefs });
      this._cache.set(sch.schema, sch);
      if (addSchema && !baseId.startsWith("#")) {
        if (baseId)
          this._checkUnique(baseId);
        this.refs[baseId] = sch;
      }
      if (validateSchema)
        this.validateSchema(schema, true);
      return sch;
    }
    _checkUnique(id) {
      if (this.schemas[id] || this.refs[id]) {
        throw new Error(`schema with key or id "${id}" already exists`);
      }
    }
    _compileSchemaEnv(sch) {
      if (sch.meta)
        this._compileMetaSchema(sch);
      else
        compile_1.compileSchema.call(this, sch);
      if (!sch.validate)
        throw new Error("ajv implementation error");
      return sch.validate;
    }
    _compileMetaSchema(sch) {
      const currentOpts = this.opts;
      this.opts = this._metaOpts;
      try {
        compile_1.compileSchema.call(this, sch);
      } finally {
        this.opts = currentOpts;
      }
    }
  }
  Ajv.ValidationError = validation_error_1.default;
  Ajv.MissingRefError = ref_error_1.default;
  exports.default = Ajv;
  function checkOptions(checkOpts, options, msg, log = "error") {
    for (const key in checkOpts) {
      const opt = key;
      if (opt in options)
        this.logger[log](`${msg}: option ${key}. ${checkOpts[opt]}`);
    }
  }
  function getSchEnv(keyRef) {
    keyRef = (0, resolve_1.normalizeId)(keyRef);
    return this.schemas[keyRef] || this.refs[keyRef];
  }
  function addInitialSchemas() {
    const optsSchemas = this.opts.schemas;
    if (!optsSchemas)
      return;
    if (Array.isArray(optsSchemas))
      this.addSchema(optsSchemas);
    else
      for (const key in optsSchemas)
        this.addSchema(optsSchemas[key], key);
  }
  function addInitialFormats() {
    for (const name in this.opts.formats) {
      const format = this.opts.formats[name];
      if (format)
        this.addFormat(name, format);
    }
  }
  function addInitialKeywords(defs) {
    if (Array.isArray(defs)) {
      this.addVocabulary(defs);
      return;
    }
    this.logger.warn("keywords option as map is deprecated, pass array");
    for (const keyword in defs) {
      const def = defs[keyword];
      if (!def.keyword)
        def.keyword = keyword;
      this.addKeyword(def);
    }
  }
  function getMetaSchemaOptions() {
    const metaOpts = { ...this.opts };
    for (const opt of META_IGNORE_OPTIONS)
      delete metaOpts[opt];
    return metaOpts;
  }
  var noLogs = { log() {}, warn() {}, error() {} };
  function getLogger(logger) {
    if (logger === false)
      return noLogs;
    if (logger === undefined)
      return console;
    if (logger.log && logger.warn && logger.error)
      return logger;
    throw new Error("logger must implement log, warn and error methods");
  }
  var KEYWORD_NAME = /^[a-z_$][a-z0-9_$:-]*$/i;
  function checkKeyword(keyword, def) {
    const { RULES } = this;
    (0, util_1.eachItem)(keyword, (kwd) => {
      if (RULES.keywords[kwd])
        throw new Error(`Keyword ${kwd} is already defined`);
      if (!KEYWORD_NAME.test(kwd))
        throw new Error(`Keyword ${kwd} has invalid name`);
    });
    if (!def)
      return;
    if (def.$data && !(("code" in def) || ("validate" in def))) {
      throw new Error('$data keyword must have "code" or "validate" function');
    }
  }
  function addRule(keyword, definition, dataType) {
    var _a;
    const post = definition === null || definition === undefined ? undefined : definition.post;
    if (dataType && post)
      throw new Error('keyword with "post" flag cannot have "type"');
    const { RULES } = this;
    let ruleGroup = post ? RULES.post : RULES.rules.find(({ type: t }) => t === dataType);
    if (!ruleGroup) {
      ruleGroup = { type: dataType, rules: [] };
      RULES.rules.push(ruleGroup);
    }
    RULES.keywords[keyword] = true;
    if (!definition)
      return;
    const rule = {
      keyword,
      definition: {
        ...definition,
        type: (0, dataType_1.getJSONTypes)(definition.type),
        schemaType: (0, dataType_1.getJSONTypes)(definition.schemaType)
      }
    };
    if (definition.before)
      addBeforeRule.call(this, ruleGroup, rule, definition.before);
    else
      ruleGroup.rules.push(rule);
    RULES.all[keyword] = rule;
    (_a = definition.implements) === null || _a === undefined || _a.forEach((kwd) => this.addKeyword(kwd));
  }
  function addBeforeRule(ruleGroup, rule, before) {
    const i = ruleGroup.rules.findIndex((_rule) => _rule.keyword === before);
    if (i >= 0) {
      ruleGroup.rules.splice(i, 0, rule);
    } else {
      ruleGroup.rules.push(rule);
      this.logger.warn(`rule ${before} is not defined`);
    }
  }
  function keywordMetaschema(def) {
    let { metaSchema } = def;
    if (metaSchema === undefined)
      return;
    if (def.$data && this.opts.$data)
      metaSchema = schemaOrData(metaSchema);
    def.validateSchema = this.compile(metaSchema, true);
  }
  var $dataRef = {
    $ref: "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#"
  };
  function schemaOrData(schema) {
    return { anyOf: [schema, $dataRef] };
  }
});

// node_modules/.pnpm/ajv@8.17.1/node_modules/ajv/dist/vocabularies/core/id.js
var require_id = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var def = {
    keyword: "id",
    code() {
      throw new Error('NOT SUPPORTED: keyword "id", use "$id" for schema ID');
    }
  };
  exports.default = def;
});

// node_modules/.pnpm/ajv@8.17.1/node_modules/ajv/dist/vocabularies/core/ref.js
var require_ref = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.callRef = exports.getValidate = undefined;
  var ref_error_1 = require_ref_error();
  var code_1 = require_code2();
  var codegen_1 = require_codegen();
  var names_1 = require_names();
  var compile_1 = require_compile();
  var util_1 = require_util();
  var def = {
    keyword: "$ref",
    schemaType: "string",
    code(cxt) {
      const { gen, schema: $ref, it } = cxt;
      const { baseId, schemaEnv: env, validateName, opts, self } = it;
      const { root } = env;
      if (($ref === "#" || $ref === "#/") && baseId === root.baseId)
        return callRootRef();
      const schOrEnv = compile_1.resolveRef.call(self, root, baseId, $ref);
      if (schOrEnv === undefined)
        throw new ref_error_1.default(it.opts.uriResolver, baseId, $ref);
      if (schOrEnv instanceof compile_1.SchemaEnv)
        return callValidate(schOrEnv);
      return inlineRefSchema(schOrEnv);
      function callRootRef() {
        if (env === root)
          return callRef(cxt, validateName, env, env.$async);
        const rootName = gen.scopeValue("root", { ref: root });
        return callRef(cxt, (0, codegen_1._)`${rootName}.validate`, root, root.$async);
      }
      function callValidate(sch) {
        const v = getValidate(cxt, sch);
        callRef(cxt, v, sch, sch.$async);
      }
      function inlineRefSchema(sch) {
        const schName = gen.scopeValue("schema", opts.code.source === true ? { ref: sch, code: (0, codegen_1.stringify)(sch) } : { ref: sch });
        const valid = gen.name("valid");
        const schCxt = cxt.subschema({
          schema: sch,
          dataTypes: [],
          schemaPath: codegen_1.nil,
          topSchemaRef: schName,
          errSchemaPath: $ref
        }, valid);
        cxt.mergeEvaluated(schCxt);
        cxt.ok(valid);
      }
    }
  };
  function getValidate(cxt, sch) {
    const { gen } = cxt;
    return sch.validate ? gen.scopeValue("validate", { ref: sch.validate }) : (0, codegen_1._)`${gen.scopeValue("wrapper", { ref: sch })}.validate`;
  }
  exports.getValidate = getValidate;
  function callRef(cxt, v, sch, $async) {
    const { gen, it } = cxt;
    const { allErrors, schemaEnv: env, opts } = it;
    const passCxt = opts.passContext ? names_1.default.this : codegen_1.nil;
    if ($async)
      callAsyncRef();
    else
      callSyncRef();
    function callAsyncRef() {
      if (!env.$async)
        throw new Error("async schema referenced by sync schema");
      const valid = gen.let("valid");
      gen.try(() => {
        gen.code((0, codegen_1._)`await ${(0, code_1.callValidateCode)(cxt, v, passCxt)}`);
        addEvaluatedFrom(v);
        if (!allErrors)
          gen.assign(valid, true);
      }, (e) => {
        gen.if((0, codegen_1._)`!(${e} instanceof ${it.ValidationError})`, () => gen.throw(e));
        addErrorsFrom(e);
        if (!allErrors)
          gen.assign(valid, false);
      });
      cxt.ok(valid);
    }
    function callSyncRef() {
      cxt.result((0, code_1.callValidateCode)(cxt, v, passCxt), () => addEvaluatedFrom(v), () => addErrorsFrom(v));
    }
    function addErrorsFrom(source) {
      const errs = (0, codegen_1._)`${source}.errors`;
      gen.assign(names_1.default.vErrors, (0, codegen_1._)`${names_1.default.vErrors} === null ? ${errs} : ${names_1.default.vErrors}.concat(${errs})`);
      gen.assign(names_1.default.errors, (0, codegen_1._)`${names_1.default.vErrors}.length`);
    }
    function addEvaluatedFrom(source) {
      var _a;
      if (!it.opts.unevaluated)
        return;
      const schEvaluated = (_a = sch === null || sch === undefined ? undefined : sch.validate) === null || _a === undefined ? undefined : _a.evaluated;
      if (it.props !== true) {
        if (schEvaluated && !schEvaluated.dynamicProps) {
          if (schEvaluated.props !== undefined) {
            it.props = util_1.mergeEvaluated.props(gen, schEvaluated.props, it.props);
          }
        } else {
          const props = gen.var("props", (0, codegen_1._)`${source}.evaluated.props`);
          it.props = util_1.mergeEvaluated.props(gen, props, it.props, codegen_1.Name);
        }
      }
      if (it.items !== true) {
        if (schEvaluated && !schEvaluated.dynamicItems) {
          if (schEvaluated.items !== undefined) {
            it.items = util_1.mergeEvaluated.items(gen, schEvaluated.items, it.items);
          }
        } else {
          const items = gen.var("items", (0, codegen_1._)`${source}.evaluated.items`);
          it.items = util_1.mergeEvaluated.items(gen, items, it.items, codegen_1.Name);
        }
      }
    }
  }
  exports.callRef = callRef;
  exports.default = def;
});

// node_modules/.pnpm/ajv@8.17.1/node_modules/ajv/dist/vocabularies/core/index.js
var require_core2 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var id_1 = require_id();
  var ref_1 = require_ref();
  var core = [
    "$schema",
    "$id",
    "$defs",
    "$vocabulary",
    { keyword: "$comment" },
    "definitions",
    id_1.default,
    ref_1.default
  ];
  exports.default = core;
});

// node_modules/.pnpm/ajv@8.17.1/node_modules/ajv/dist/vocabularies/validation/limitNumber.js
var require_limitNumber = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var codegen_1 = require_codegen();
  var ops = codegen_1.operators;
  var KWDs = {
    maximum: { okStr: "<=", ok: ops.LTE, fail: ops.GT },
    minimum: { okStr: ">=", ok: ops.GTE, fail: ops.LT },
    exclusiveMaximum: { okStr: "<", ok: ops.LT, fail: ops.GTE },
    exclusiveMinimum: { okStr: ">", ok: ops.GT, fail: ops.LTE }
  };
  var error = {
    message: ({ keyword, schemaCode }) => (0, codegen_1.str)`must be ${KWDs[keyword].okStr} ${schemaCode}`,
    params: ({ keyword, schemaCode }) => (0, codegen_1._)`{comparison: ${KWDs[keyword].okStr}, limit: ${schemaCode}}`
  };
  var def = {
    keyword: Object.keys(KWDs),
    type: "number",
    schemaType: "number",
    $data: true,
    error,
    code(cxt) {
      const { keyword, data, schemaCode } = cxt;
      cxt.fail$data((0, codegen_1._)`${data} ${KWDs[keyword].fail} ${schemaCode} || isNaN(${data})`);
    }
  };
  exports.default = def;
});

// node_modules/.pnpm/ajv@8.17.1/node_modules/ajv/dist/vocabularies/validation/multipleOf.js
var require_multipleOf = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var codegen_1 = require_codegen();
  var error = {
    message: ({ schemaCode }) => (0, codegen_1.str)`must be multiple of ${schemaCode}`,
    params: ({ schemaCode }) => (0, codegen_1._)`{multipleOf: ${schemaCode}}`
  };
  var def = {
    keyword: "multipleOf",
    type: "number",
    schemaType: "number",
    $data: true,
    error,
    code(cxt) {
      const { gen, data, schemaCode, it } = cxt;
      const prec = it.opts.multipleOfPrecision;
      const res = gen.let("res");
      const invalid = prec ? (0, codegen_1._)`Math.abs(Math.round(${res}) - ${res}) > 1e-${prec}` : (0, codegen_1._)`${res} !== parseInt(${res})`;
      cxt.fail$data((0, codegen_1._)`(${schemaCode} === 0 || (${res} = ${data}/${schemaCode}, ${invalid}))`);
    }
  };
  exports.default = def;
});

// node_modules/.pnpm/ajv@8.17.1/node_modules/ajv/dist/runtime/ucs2length.js
var require_ucs2length = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  function ucs2length(str) {
    const len = str.length;
    let length = 0;
    let pos = 0;
    let value;
    while (pos < len) {
      length++;
      value = str.charCodeAt(pos++);
      if (value >= 55296 && value <= 56319 && pos < len) {
        value = str.charCodeAt(pos);
        if ((value & 64512) === 56320)
          pos++;
      }
    }
    return length;
  }
  exports.default = ucs2length;
  ucs2length.code = 'require("ajv/dist/runtime/ucs2length").default';
});

// node_modules/.pnpm/ajv@8.17.1/node_modules/ajv/dist/vocabularies/validation/limitLength.js
var require_limitLength = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  var ucs2length_1 = require_ucs2length();
  var error = {
    message({ keyword, schemaCode }) {
      const comp = keyword === "maxLength" ? "more" : "fewer";
      return (0, codegen_1.str)`must NOT have ${comp} than ${schemaCode} characters`;
    },
    params: ({ schemaCode }) => (0, codegen_1._)`{limit: ${schemaCode}}`
  };
  var def = {
    keyword: ["maxLength", "minLength"],
    type: "string",
    schemaType: "number",
    $data: true,
    error,
    code(cxt) {
      const { keyword, data, schemaCode, it } = cxt;
      const op = keyword === "maxLength" ? codegen_1.operators.GT : codegen_1.operators.LT;
      const len = it.opts.unicode === false ? (0, codegen_1._)`${data}.length` : (0, codegen_1._)`${(0, util_1.useFunc)(cxt.gen, ucs2length_1.default)}(${data})`;
      cxt.fail$data((0, codegen_1._)`${len} ${op} ${schemaCode}`);
    }
  };
  exports.default = def;
});

// node_modules/.pnpm/ajv@8.17.1/node_modules/ajv/dist/vocabularies/validation/pattern.js
var require_pattern = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var code_1 = require_code2();
  var codegen_1 = require_codegen();
  var error = {
    message: ({ schemaCode }) => (0, codegen_1.str)`must match pattern "${schemaCode}"`,
    params: ({ schemaCode }) => (0, codegen_1._)`{pattern: ${schemaCode}}`
  };
  var def = {
    keyword: "pattern",
    type: "string",
    schemaType: "string",
    $data: true,
    error,
    code(cxt) {
      const { data, $data, schema, schemaCode, it } = cxt;
      const u = it.opts.unicodeRegExp ? "u" : "";
      const regExp = $data ? (0, codegen_1._)`(new RegExp(${schemaCode}, ${u}))` : (0, code_1.usePattern)(cxt, schema);
      cxt.fail$data((0, codegen_1._)`!${regExp}.test(${data})`);
    }
  };
  exports.default = def;
});

// node_modules/.pnpm/ajv@8.17.1/node_modules/ajv/dist/vocabularies/validation/limitProperties.js
var require_limitProperties = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var codegen_1 = require_codegen();
  var error = {
    message({ keyword, schemaCode }) {
      const comp = keyword === "maxProperties" ? "more" : "fewer";
      return (0, codegen_1.str)`must NOT have ${comp} than ${schemaCode} properties`;
    },
    params: ({ schemaCode }) => (0, codegen_1._)`{limit: ${schemaCode}}`
  };
  var def = {
    keyword: ["maxProperties", "minProperties"],
    type: "object",
    schemaType: "number",
    $data: true,
    error,
    code(cxt) {
      const { keyword, data, schemaCode } = cxt;
      const op = keyword === "maxProperties" ? codegen_1.operators.GT : codegen_1.operators.LT;
      cxt.fail$data((0, codegen_1._)`Object.keys(${data}).length ${op} ${schemaCode}`);
    }
  };
  exports.default = def;
});

// node_modules/.pnpm/ajv@8.17.1/node_modules/ajv/dist/vocabularies/validation/required.js
var require_required = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var code_1 = require_code2();
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  var error = {
    message: ({ params: { missingProperty } }) => (0, codegen_1.str)`must have required property '${missingProperty}'`,
    params: ({ params: { missingProperty } }) => (0, codegen_1._)`{missingProperty: ${missingProperty}}`
  };
  var def = {
    keyword: "required",
    type: "object",
    schemaType: "array",
    $data: true,
    error,
    code(cxt) {
      const { gen, schema, schemaCode, data, $data, it } = cxt;
      const { opts } = it;
      if (!$data && schema.length === 0)
        return;
      const useLoop = schema.length >= opts.loopRequired;
      if (it.allErrors)
        allErrorsMode();
      else
        exitOnErrorMode();
      if (opts.strictRequired) {
        const props = cxt.parentSchema.properties;
        const { definedProperties } = cxt.it;
        for (const requiredKey of schema) {
          if ((props === null || props === undefined ? undefined : props[requiredKey]) === undefined && !definedProperties.has(requiredKey)) {
            const schemaPath = it.schemaEnv.baseId + it.errSchemaPath;
            const msg = `required property "${requiredKey}" is not defined at "${schemaPath}" (strictRequired)`;
            (0, util_1.checkStrictMode)(it, msg, it.opts.strictRequired);
          }
        }
      }
      function allErrorsMode() {
        if (useLoop || $data) {
          cxt.block$data(codegen_1.nil, loopAllRequired);
        } else {
          for (const prop of schema) {
            (0, code_1.checkReportMissingProp)(cxt, prop);
          }
        }
      }
      function exitOnErrorMode() {
        const missing = gen.let("missing");
        if (useLoop || $data) {
          const valid = gen.let("valid", true);
          cxt.block$data(valid, () => loopUntilMissing(missing, valid));
          cxt.ok(valid);
        } else {
          gen.if((0, code_1.checkMissingProp)(cxt, schema, missing));
          (0, code_1.reportMissingProp)(cxt, missing);
          gen.else();
        }
      }
      function loopAllRequired() {
        gen.forOf("prop", schemaCode, (prop) => {
          cxt.setParams({ missingProperty: prop });
          gen.if((0, code_1.noPropertyInData)(gen, data, prop, opts.ownProperties), () => cxt.error());
        });
      }
      function loopUntilMissing(missing, valid) {
        cxt.setParams({ missingProperty: missing });
        gen.forOf(missing, schemaCode, () => {
          gen.assign(valid, (0, code_1.propertyInData)(gen, data, missing, opts.ownProperties));
          gen.if((0, codegen_1.not)(valid), () => {
            cxt.error();
            gen.break();
          });
        }, codegen_1.nil);
      }
    }
  };
  exports.default = def;
});

// node_modules/.pnpm/ajv@8.17.1/node_modules/ajv/dist/vocabularies/validation/limitItems.js
var require_limitItems = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var codegen_1 = require_codegen();
  var error = {
    message({ keyword, schemaCode }) {
      const comp = keyword === "maxItems" ? "more" : "fewer";
      return (0, codegen_1.str)`must NOT have ${comp} than ${schemaCode} items`;
    },
    params: ({ schemaCode }) => (0, codegen_1._)`{limit: ${schemaCode}}`
  };
  var def = {
    keyword: ["maxItems", "minItems"],
    type: "array",
    schemaType: "number",
    $data: true,
    error,
    code(cxt) {
      const { keyword, data, schemaCode } = cxt;
      const op = keyword === "maxItems" ? codegen_1.operators.GT : codegen_1.operators.LT;
      cxt.fail$data((0, codegen_1._)`${data}.length ${op} ${schemaCode}`);
    }
  };
  exports.default = def;
});

// node_modules/.pnpm/ajv@8.17.1/node_modules/ajv/dist/runtime/equal.js
var require_equal = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var equal = require_fast_deep_equal();
  equal.code = 'require("ajv/dist/runtime/equal").default';
  exports.default = equal;
});

// node_modules/.pnpm/ajv@8.17.1/node_modules/ajv/dist/vocabularies/validation/uniqueItems.js
var require_uniqueItems = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var dataType_1 = require_dataType();
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  var equal_1 = require_equal();
  var error = {
    message: ({ params: { i, j } }) => (0, codegen_1.str)`must NOT have duplicate items (items ## ${j} and ${i} are identical)`,
    params: ({ params: { i, j } }) => (0, codegen_1._)`{i: ${i}, j: ${j}}`
  };
  var def = {
    keyword: "uniqueItems",
    type: "array",
    schemaType: "boolean",
    $data: true,
    error,
    code(cxt) {
      const { gen, data, $data, schema, parentSchema, schemaCode, it } = cxt;
      if (!$data && !schema)
        return;
      const valid = gen.let("valid");
      const itemTypes = parentSchema.items ? (0, dataType_1.getSchemaTypes)(parentSchema.items) : [];
      cxt.block$data(valid, validateUniqueItems, (0, codegen_1._)`${schemaCode} === false`);
      cxt.ok(valid);
      function validateUniqueItems() {
        const i = gen.let("i", (0, codegen_1._)`${data}.length`);
        const j = gen.let("j");
        cxt.setParams({ i, j });
        gen.assign(valid, true);
        gen.if((0, codegen_1._)`${i} > 1`, () => (canOptimize() ? loopN : loopN2)(i, j));
      }
      function canOptimize() {
        return itemTypes.length > 0 && !itemTypes.some((t) => t === "object" || t === "array");
      }
      function loopN(i, j) {
        const item = gen.name("item");
        const wrongType = (0, dataType_1.checkDataTypes)(itemTypes, item, it.opts.strictNumbers, dataType_1.DataType.Wrong);
        const indices = gen.const("indices", (0, codegen_1._)`{}`);
        gen.for((0, codegen_1._)`;${i}--;`, () => {
          gen.let(item, (0, codegen_1._)`${data}[${i}]`);
          gen.if(wrongType, (0, codegen_1._)`continue`);
          if (itemTypes.length > 1)
            gen.if((0, codegen_1._)`typeof ${item} == "string"`, (0, codegen_1._)`${item} += "_"`);
          gen.if((0, codegen_1._)`typeof ${indices}[${item}] == "number"`, () => {
            gen.assign(j, (0, codegen_1._)`${indices}[${item}]`);
            cxt.error();
            gen.assign(valid, false).break();
          }).code((0, codegen_1._)`${indices}[${item}] = ${i}`);
        });
      }
      function loopN2(i, j) {
        const eql = (0, util_1.useFunc)(gen, equal_1.default);
        const outer = gen.name("outer");
        gen.label(outer).for((0, codegen_1._)`;${i}--;`, () => gen.for((0, codegen_1._)`${j} = ${i}; ${j}--;`, () => gen.if((0, codegen_1._)`${eql}(${data}[${i}], ${data}[${j}])`, () => {
          cxt.error();
          gen.assign(valid, false).break(outer);
        })));
      }
    }
  };
  exports.default = def;
});

// node_modules/.pnpm/ajv@8.17.1/node_modules/ajv/dist/vocabularies/validation/const.js
var require_const = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  var equal_1 = require_equal();
  var error = {
    message: "must be equal to constant",
    params: ({ schemaCode }) => (0, codegen_1._)`{allowedValue: ${schemaCode}}`
  };
  var def = {
    keyword: "const",
    $data: true,
    error,
    code(cxt) {
      const { gen, data, $data, schemaCode, schema } = cxt;
      if ($data || schema && typeof schema == "object") {
        cxt.fail$data((0, codegen_1._)`!${(0, util_1.useFunc)(gen, equal_1.default)}(${data}, ${schemaCode})`);
      } else {
        cxt.fail((0, codegen_1._)`${schema} !== ${data}`);
      }
    }
  };
  exports.default = def;
});

// node_modules/.pnpm/ajv@8.17.1/node_modules/ajv/dist/vocabularies/validation/enum.js
var require_enum = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  var equal_1 = require_equal();
  var error = {
    message: "must be equal to one of the allowed values",
    params: ({ schemaCode }) => (0, codegen_1._)`{allowedValues: ${schemaCode}}`
  };
  var def = {
    keyword: "enum",
    schemaType: "array",
    $data: true,
    error,
    code(cxt) {
      const { gen, data, $data, schema, schemaCode, it } = cxt;
      if (!$data && schema.length === 0)
        throw new Error("enum must have non-empty array");
      const useLoop = schema.length >= it.opts.loopEnum;
      let eql;
      const getEql = () => eql !== null && eql !== undefined ? eql : eql = (0, util_1.useFunc)(gen, equal_1.default);
      let valid;
      if (useLoop || $data) {
        valid = gen.let("valid");
        cxt.block$data(valid, loopEnum);
      } else {
        if (!Array.isArray(schema))
          throw new Error("ajv implementation error");
        const vSchema = gen.const("vSchema", schemaCode);
        valid = (0, codegen_1.or)(...schema.map((_x, i) => equalCode(vSchema, i)));
      }
      cxt.pass(valid);
      function loopEnum() {
        gen.assign(valid, false);
        gen.forOf("v", schemaCode, (v) => gen.if((0, codegen_1._)`${getEql()}(${data}, ${v})`, () => gen.assign(valid, true).break()));
      }
      function equalCode(vSchema, i) {
        const sch = schema[i];
        return typeof sch === "object" && sch !== null ? (0, codegen_1._)`${getEql()}(${data}, ${vSchema}[${i}])` : (0, codegen_1._)`${data} === ${sch}`;
      }
    }
  };
  exports.default = def;
});

// node_modules/.pnpm/ajv@8.17.1/node_modules/ajv/dist/vocabularies/validation/index.js
var require_validation = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var limitNumber_1 = require_limitNumber();
  var multipleOf_1 = require_multipleOf();
  var limitLength_1 = require_limitLength();
  var pattern_1 = require_pattern();
  var limitProperties_1 = require_limitProperties();
  var required_1 = require_required();
  var limitItems_1 = require_limitItems();
  var uniqueItems_1 = require_uniqueItems();
  var const_1 = require_const();
  var enum_1 = require_enum();
  var validation = [
    limitNumber_1.default,
    multipleOf_1.default,
    limitLength_1.default,
    pattern_1.default,
    limitProperties_1.default,
    required_1.default,
    limitItems_1.default,
    uniqueItems_1.default,
    { keyword: "type", schemaType: ["string", "array"] },
    { keyword: "nullable", schemaType: "boolean" },
    const_1.default,
    enum_1.default
  ];
  exports.default = validation;
});

// node_modules/.pnpm/ajv@8.17.1/node_modules/ajv/dist/vocabularies/applicator/additionalItems.js
var require_additionalItems = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.validateAdditionalItems = undefined;
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  var error = {
    message: ({ params: { len } }) => (0, codegen_1.str)`must NOT have more than ${len} items`,
    params: ({ params: { len } }) => (0, codegen_1._)`{limit: ${len}}`
  };
  var def = {
    keyword: "additionalItems",
    type: "array",
    schemaType: ["boolean", "object"],
    before: "uniqueItems",
    error,
    code(cxt) {
      const { parentSchema, it } = cxt;
      const { items } = parentSchema;
      if (!Array.isArray(items)) {
        (0, util_1.checkStrictMode)(it, '"additionalItems" is ignored when "items" is not an array of schemas');
        return;
      }
      validateAdditionalItems(cxt, items);
    }
  };
  function validateAdditionalItems(cxt, items) {
    const { gen, schema, data, keyword, it } = cxt;
    it.items = true;
    const len = gen.const("len", (0, codegen_1._)`${data}.length`);
    if (schema === false) {
      cxt.setParams({ len: items.length });
      cxt.pass((0, codegen_1._)`${len} <= ${items.length}`);
    } else if (typeof schema == "object" && !(0, util_1.alwaysValidSchema)(it, schema)) {
      const valid = gen.var("valid", (0, codegen_1._)`${len} <= ${items.length}`);
      gen.if((0, codegen_1.not)(valid), () => validateItems(valid));
      cxt.ok(valid);
    }
    function validateItems(valid) {
      gen.forRange("i", items.length, len, (i) => {
        cxt.subschema({ keyword, dataProp: i, dataPropType: util_1.Type.Num }, valid);
        if (!it.allErrors)
          gen.if((0, codegen_1.not)(valid), () => gen.break());
      });
    }
  }
  exports.validateAdditionalItems = validateAdditionalItems;
  exports.default = def;
});

// node_modules/.pnpm/ajv@8.17.1/node_modules/ajv/dist/vocabularies/applicator/items.js
var require_items = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.validateTuple = undefined;
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  var code_1 = require_code2();
  var def = {
    keyword: "items",
    type: "array",
    schemaType: ["object", "array", "boolean"],
    before: "uniqueItems",
    code(cxt) {
      const { schema, it } = cxt;
      if (Array.isArray(schema))
        return validateTuple(cxt, "additionalItems", schema);
      it.items = true;
      if ((0, util_1.alwaysValidSchema)(it, schema))
        return;
      cxt.ok((0, code_1.validateArray)(cxt));
    }
  };
  function validateTuple(cxt, extraItems, schArr = cxt.schema) {
    const { gen, parentSchema, data, keyword, it } = cxt;
    checkStrictTuple(parentSchema);
    if (it.opts.unevaluated && schArr.length && it.items !== true) {
      it.items = util_1.mergeEvaluated.items(gen, schArr.length, it.items);
    }
    const valid = gen.name("valid");
    const len = gen.const("len", (0, codegen_1._)`${data}.length`);
    schArr.forEach((sch, i) => {
      if ((0, util_1.alwaysValidSchema)(it, sch))
        return;
      gen.if((0, codegen_1._)`${len} > ${i}`, () => cxt.subschema({
        keyword,
        schemaProp: i,
        dataProp: i
      }, valid));
      cxt.ok(valid);
    });
    function checkStrictTuple(sch) {
      const { opts, errSchemaPath } = it;
      const l = schArr.length;
      const fullTuple = l === sch.minItems && (l === sch.maxItems || sch[extraItems] === false);
      if (opts.strictTuples && !fullTuple) {
        const msg = `"${keyword}" is ${l}-tuple, but minItems or maxItems/${extraItems} are not specified or different at path "${errSchemaPath}"`;
        (0, util_1.checkStrictMode)(it, msg, opts.strictTuples);
      }
    }
  }
  exports.validateTuple = validateTuple;
  exports.default = def;
});

// node_modules/.pnpm/ajv@8.17.1/node_modules/ajv/dist/vocabularies/applicator/prefixItems.js
var require_prefixItems = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var items_1 = require_items();
  var def = {
    keyword: "prefixItems",
    type: "array",
    schemaType: ["array"],
    before: "uniqueItems",
    code: (cxt) => (0, items_1.validateTuple)(cxt, "items")
  };
  exports.default = def;
});

// node_modules/.pnpm/ajv@8.17.1/node_modules/ajv/dist/vocabularies/applicator/items2020.js
var require_items2020 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  var code_1 = require_code2();
  var additionalItems_1 = require_additionalItems();
  var error = {
    message: ({ params: { len } }) => (0, codegen_1.str)`must NOT have more than ${len} items`,
    params: ({ params: { len } }) => (0, codegen_1._)`{limit: ${len}}`
  };
  var def = {
    keyword: "items",
    type: "array",
    schemaType: ["object", "boolean"],
    before: "uniqueItems",
    error,
    code(cxt) {
      const { schema, parentSchema, it } = cxt;
      const { prefixItems } = parentSchema;
      it.items = true;
      if ((0, util_1.alwaysValidSchema)(it, schema))
        return;
      if (prefixItems)
        (0, additionalItems_1.validateAdditionalItems)(cxt, prefixItems);
      else
        cxt.ok((0, code_1.validateArray)(cxt));
    }
  };
  exports.default = def;
});

// node_modules/.pnpm/ajv@8.17.1/node_modules/ajv/dist/vocabularies/applicator/contains.js
var require_contains = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  var error = {
    message: ({ params: { min, max } }) => max === undefined ? (0, codegen_1.str)`must contain at least ${min} valid item(s)` : (0, codegen_1.str)`must contain at least ${min} and no more than ${max} valid item(s)`,
    params: ({ params: { min, max } }) => max === undefined ? (0, codegen_1._)`{minContains: ${min}}` : (0, codegen_1._)`{minContains: ${min}, maxContains: ${max}}`
  };
  var def = {
    keyword: "contains",
    type: "array",
    schemaType: ["object", "boolean"],
    before: "uniqueItems",
    trackErrors: true,
    error,
    code(cxt) {
      const { gen, schema, parentSchema, data, it } = cxt;
      let min;
      let max;
      const { minContains, maxContains } = parentSchema;
      if (it.opts.next) {
        min = minContains === undefined ? 1 : minContains;
        max = maxContains;
      } else {
        min = 1;
      }
      const len = gen.const("len", (0, codegen_1._)`${data}.length`);
      cxt.setParams({ min, max });
      if (max === undefined && min === 0) {
        (0, util_1.checkStrictMode)(it, `"minContains" == 0 without "maxContains": "contains" keyword ignored`);
        return;
      }
      if (max !== undefined && min > max) {
        (0, util_1.checkStrictMode)(it, `"minContains" > "maxContains" is always invalid`);
        cxt.fail();
        return;
      }
      if ((0, util_1.alwaysValidSchema)(it, schema)) {
        let cond = (0, codegen_1._)`${len} >= ${min}`;
        if (max !== undefined)
          cond = (0, codegen_1._)`${cond} && ${len} <= ${max}`;
        cxt.pass(cond);
        return;
      }
      it.items = true;
      const valid = gen.name("valid");
      if (max === undefined && min === 1) {
        validateItems(valid, () => gen.if(valid, () => gen.break()));
      } else if (min === 0) {
        gen.let(valid, true);
        if (max !== undefined)
          gen.if((0, codegen_1._)`${data}.length > 0`, validateItemsWithCount);
      } else {
        gen.let(valid, false);
        validateItemsWithCount();
      }
      cxt.result(valid, () => cxt.reset());
      function validateItemsWithCount() {
        const schValid = gen.name("_valid");
        const count = gen.let("count", 0);
        validateItems(schValid, () => gen.if(schValid, () => checkLimits(count)));
      }
      function validateItems(_valid, block) {
        gen.forRange("i", 0, len, (i) => {
          cxt.subschema({
            keyword: "contains",
            dataProp: i,
            dataPropType: util_1.Type.Num,
            compositeRule: true
          }, _valid);
          block();
        });
      }
      function checkLimits(count) {
        gen.code((0, codegen_1._)`${count}++`);
        if (max === undefined) {
          gen.if((0, codegen_1._)`${count} >= ${min}`, () => gen.assign(valid, true).break());
        } else {
          gen.if((0, codegen_1._)`${count} > ${max}`, () => gen.assign(valid, false).break());
          if (min === 1)
            gen.assign(valid, true);
          else
            gen.if((0, codegen_1._)`${count} >= ${min}`, () => gen.assign(valid, true));
        }
      }
    }
  };
  exports.default = def;
});

// node_modules/.pnpm/ajv@8.17.1/node_modules/ajv/dist/vocabularies/applicator/dependencies.js
var require_dependencies = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.validateSchemaDeps = exports.validatePropertyDeps = exports.error = undefined;
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  var code_1 = require_code2();
  exports.error = {
    message: ({ params: { property, depsCount, deps } }) => {
      const property_ies = depsCount === 1 ? "property" : "properties";
      return (0, codegen_1.str)`must have ${property_ies} ${deps} when property ${property} is present`;
    },
    params: ({ params: { property, depsCount, deps, missingProperty } }) => (0, codegen_1._)`{property: ${property},
    missingProperty: ${missingProperty},
    depsCount: ${depsCount},
    deps: ${deps}}`
  };
  var def = {
    keyword: "dependencies",
    type: "object",
    schemaType: "object",
    error: exports.error,
    code(cxt) {
      const [propDeps, schDeps] = splitDependencies(cxt);
      validatePropertyDeps(cxt, propDeps);
      validateSchemaDeps(cxt, schDeps);
    }
  };
  function splitDependencies({ schema }) {
    const propertyDeps = {};
    const schemaDeps = {};
    for (const key in schema) {
      if (key === "__proto__")
        continue;
      const deps = Array.isArray(schema[key]) ? propertyDeps : schemaDeps;
      deps[key] = schema[key];
    }
    return [propertyDeps, schemaDeps];
  }
  function validatePropertyDeps(cxt, propertyDeps = cxt.schema) {
    const { gen, data, it } = cxt;
    if (Object.keys(propertyDeps).length === 0)
      return;
    const missing = gen.let("missing");
    for (const prop in propertyDeps) {
      const deps = propertyDeps[prop];
      if (deps.length === 0)
        continue;
      const hasProperty = (0, code_1.propertyInData)(gen, data, prop, it.opts.ownProperties);
      cxt.setParams({
        property: prop,
        depsCount: deps.length,
        deps: deps.join(", ")
      });
      if (it.allErrors) {
        gen.if(hasProperty, () => {
          for (const depProp of deps) {
            (0, code_1.checkReportMissingProp)(cxt, depProp);
          }
        });
      } else {
        gen.if((0, codegen_1._)`${hasProperty} && (${(0, code_1.checkMissingProp)(cxt, deps, missing)})`);
        (0, code_1.reportMissingProp)(cxt, missing);
        gen.else();
      }
    }
  }
  exports.validatePropertyDeps = validatePropertyDeps;
  function validateSchemaDeps(cxt, schemaDeps = cxt.schema) {
    const { gen, data, keyword, it } = cxt;
    const valid = gen.name("valid");
    for (const prop in schemaDeps) {
      if ((0, util_1.alwaysValidSchema)(it, schemaDeps[prop]))
        continue;
      gen.if((0, code_1.propertyInData)(gen, data, prop, it.opts.ownProperties), () => {
        const schCxt = cxt.subschema({ keyword, schemaProp: prop }, valid);
        cxt.mergeValidEvaluated(schCxt, valid);
      }, () => gen.var(valid, true));
      cxt.ok(valid);
    }
  }
  exports.validateSchemaDeps = validateSchemaDeps;
  exports.default = def;
});

// node_modules/.pnpm/ajv@8.17.1/node_modules/ajv/dist/vocabularies/applicator/propertyNames.js
var require_propertyNames = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  var error = {
    message: "property name must be valid",
    params: ({ params }) => (0, codegen_1._)`{propertyName: ${params.propertyName}}`
  };
  var def = {
    keyword: "propertyNames",
    type: "object",
    schemaType: ["object", "boolean"],
    error,
    code(cxt) {
      const { gen, schema, data, it } = cxt;
      if ((0, util_1.alwaysValidSchema)(it, schema))
        return;
      const valid = gen.name("valid");
      gen.forIn("key", data, (key) => {
        cxt.setParams({ propertyName: key });
        cxt.subschema({
          keyword: "propertyNames",
          data: key,
          dataTypes: ["string"],
          propertyName: key,
          compositeRule: true
        }, valid);
        gen.if((0, codegen_1.not)(valid), () => {
          cxt.error(true);
          if (!it.allErrors)
            gen.break();
        });
      });
      cxt.ok(valid);
    }
  };
  exports.default = def;
});

// node_modules/.pnpm/ajv@8.17.1/node_modules/ajv/dist/vocabularies/applicator/additionalProperties.js
var require_additionalProperties = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var code_1 = require_code2();
  var codegen_1 = require_codegen();
  var names_1 = require_names();
  var util_1 = require_util();
  var error = {
    message: "must NOT have additional properties",
    params: ({ params }) => (0, codegen_1._)`{additionalProperty: ${params.additionalProperty}}`
  };
  var def = {
    keyword: "additionalProperties",
    type: ["object"],
    schemaType: ["boolean", "object"],
    allowUndefined: true,
    trackErrors: true,
    error,
    code(cxt) {
      const { gen, schema, parentSchema, data, errsCount, it } = cxt;
      if (!errsCount)
        throw new Error("ajv implementation error");
      const { allErrors, opts } = it;
      it.props = true;
      if (opts.removeAdditional !== "all" && (0, util_1.alwaysValidSchema)(it, schema))
        return;
      const props = (0, code_1.allSchemaProperties)(parentSchema.properties);
      const patProps = (0, code_1.allSchemaProperties)(parentSchema.patternProperties);
      checkAdditionalProperties();
      cxt.ok((0, codegen_1._)`${errsCount} === ${names_1.default.errors}`);
      function checkAdditionalProperties() {
        gen.forIn("key", data, (key) => {
          if (!props.length && !patProps.length)
            additionalPropertyCode(key);
          else
            gen.if(isAdditional(key), () => additionalPropertyCode(key));
        });
      }
      function isAdditional(key) {
        let definedProp;
        if (props.length > 8) {
          const propsSchema = (0, util_1.schemaRefOrVal)(it, parentSchema.properties, "properties");
          definedProp = (0, code_1.isOwnProperty)(gen, propsSchema, key);
        } else if (props.length) {
          definedProp = (0, codegen_1.or)(...props.map((p) => (0, codegen_1._)`${key} === ${p}`));
        } else {
          definedProp = codegen_1.nil;
        }
        if (patProps.length) {
          definedProp = (0, codegen_1.or)(definedProp, ...patProps.map((p) => (0, codegen_1._)`${(0, code_1.usePattern)(cxt, p)}.test(${key})`));
        }
        return (0, codegen_1.not)(definedProp);
      }
      function deleteAdditional(key) {
        gen.code((0, codegen_1._)`delete ${data}[${key}]`);
      }
      function additionalPropertyCode(key) {
        if (opts.removeAdditional === "all" || opts.removeAdditional && schema === false) {
          deleteAdditional(key);
          return;
        }
        if (schema === false) {
          cxt.setParams({ additionalProperty: key });
          cxt.error();
          if (!allErrors)
            gen.break();
          return;
        }
        if (typeof schema == "object" && !(0, util_1.alwaysValidSchema)(it, schema)) {
          const valid = gen.name("valid");
          if (opts.removeAdditional === "failing") {
            applyAdditionalSchema(key, valid, false);
            gen.if((0, codegen_1.not)(valid), () => {
              cxt.reset();
              deleteAdditional(key);
            });
          } else {
            applyAdditionalSchema(key, valid);
            if (!allErrors)
              gen.if((0, codegen_1.not)(valid), () => gen.break());
          }
        }
      }
      function applyAdditionalSchema(key, valid, errors) {
        const subschema = {
          keyword: "additionalProperties",
          dataProp: key,
          dataPropType: util_1.Type.Str
        };
        if (errors === false) {
          Object.assign(subschema, {
            compositeRule: true,
            createErrors: false,
            allErrors: false
          });
        }
        cxt.subschema(subschema, valid);
      }
    }
  };
  exports.default = def;
});

// node_modules/.pnpm/ajv@8.17.1/node_modules/ajv/dist/vocabularies/applicator/properties.js
var require_properties = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var validate_1 = require_validate();
  var code_1 = require_code2();
  var util_1 = require_util();
  var additionalProperties_1 = require_additionalProperties();
  var def = {
    keyword: "properties",
    type: "object",
    schemaType: "object",
    code(cxt) {
      const { gen, schema, parentSchema, data, it } = cxt;
      if (it.opts.removeAdditional === "all" && parentSchema.additionalProperties === undefined) {
        additionalProperties_1.default.code(new validate_1.KeywordCxt(it, additionalProperties_1.default, "additionalProperties"));
      }
      const allProps = (0, code_1.allSchemaProperties)(schema);
      for (const prop of allProps) {
        it.definedProperties.add(prop);
      }
      if (it.opts.unevaluated && allProps.length && it.props !== true) {
        it.props = util_1.mergeEvaluated.props(gen, (0, util_1.toHash)(allProps), it.props);
      }
      const properties = allProps.filter((p) => !(0, util_1.alwaysValidSchema)(it, schema[p]));
      if (properties.length === 0)
        return;
      const valid = gen.name("valid");
      for (const prop of properties) {
        if (hasDefault(prop)) {
          applyPropertySchema(prop);
        } else {
          gen.if((0, code_1.propertyInData)(gen, data, prop, it.opts.ownProperties));
          applyPropertySchema(prop);
          if (!it.allErrors)
            gen.else().var(valid, true);
          gen.endIf();
        }
        cxt.it.definedProperties.add(prop);
        cxt.ok(valid);
      }
      function hasDefault(prop) {
        return it.opts.useDefaults && !it.compositeRule && schema[prop].default !== undefined;
      }
      function applyPropertySchema(prop) {
        cxt.subschema({
          keyword: "properties",
          schemaProp: prop,
          dataProp: prop
        }, valid);
      }
    }
  };
  exports.default = def;
});

// node_modules/.pnpm/ajv@8.17.1/node_modules/ajv/dist/vocabularies/applicator/patternProperties.js
var require_patternProperties = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var code_1 = require_code2();
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  var util_2 = require_util();
  var def = {
    keyword: "patternProperties",
    type: "object",
    schemaType: "object",
    code(cxt) {
      const { gen, schema, data, parentSchema, it } = cxt;
      const { opts } = it;
      const patterns = (0, code_1.allSchemaProperties)(schema);
      const alwaysValidPatterns = patterns.filter((p) => (0, util_1.alwaysValidSchema)(it, schema[p]));
      if (patterns.length === 0 || alwaysValidPatterns.length === patterns.length && (!it.opts.unevaluated || it.props === true)) {
        return;
      }
      const checkProperties = opts.strictSchema && !opts.allowMatchingProperties && parentSchema.properties;
      const valid = gen.name("valid");
      if (it.props !== true && !(it.props instanceof codegen_1.Name)) {
        it.props = (0, util_2.evaluatedPropsToName)(gen, it.props);
      }
      const { props } = it;
      validatePatternProperties();
      function validatePatternProperties() {
        for (const pat of patterns) {
          if (checkProperties)
            checkMatchingProperties(pat);
          if (it.allErrors) {
            validateProperties(pat);
          } else {
            gen.var(valid, true);
            validateProperties(pat);
            gen.if(valid);
          }
        }
      }
      function checkMatchingProperties(pat) {
        for (const prop in checkProperties) {
          if (new RegExp(pat).test(prop)) {
            (0, util_1.checkStrictMode)(it, `property ${prop} matches pattern ${pat} (use allowMatchingProperties)`);
          }
        }
      }
      function validateProperties(pat) {
        gen.forIn("key", data, (key) => {
          gen.if((0, codegen_1._)`${(0, code_1.usePattern)(cxt, pat)}.test(${key})`, () => {
            const alwaysValid = alwaysValidPatterns.includes(pat);
            if (!alwaysValid) {
              cxt.subschema({
                keyword: "patternProperties",
                schemaProp: pat,
                dataProp: key,
                dataPropType: util_2.Type.Str
              }, valid);
            }
            if (it.opts.unevaluated && props !== true) {
              gen.assign((0, codegen_1._)`${props}[${key}]`, true);
            } else if (!alwaysValid && !it.allErrors) {
              gen.if((0, codegen_1.not)(valid), () => gen.break());
            }
          });
        });
      }
    }
  };
  exports.default = def;
});

// node_modules/.pnpm/ajv@8.17.1/node_modules/ajv/dist/vocabularies/applicator/not.js
var require_not = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var util_1 = require_util();
  var def = {
    keyword: "not",
    schemaType: ["object", "boolean"],
    trackErrors: true,
    code(cxt) {
      const { gen, schema, it } = cxt;
      if ((0, util_1.alwaysValidSchema)(it, schema)) {
        cxt.fail();
        return;
      }
      const valid = gen.name("valid");
      cxt.subschema({
        keyword: "not",
        compositeRule: true,
        createErrors: false,
        allErrors: false
      }, valid);
      cxt.failResult(valid, () => cxt.reset(), () => cxt.error());
    },
    error: { message: "must NOT be valid" }
  };
  exports.default = def;
});

// node_modules/.pnpm/ajv@8.17.1/node_modules/ajv/dist/vocabularies/applicator/anyOf.js
var require_anyOf = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var code_1 = require_code2();
  var def = {
    keyword: "anyOf",
    schemaType: "array",
    trackErrors: true,
    code: code_1.validateUnion,
    error: { message: "must match a schema in anyOf" }
  };
  exports.default = def;
});

// node_modules/.pnpm/ajv@8.17.1/node_modules/ajv/dist/vocabularies/applicator/oneOf.js
var require_oneOf = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  var error = {
    message: "must match exactly one schema in oneOf",
    params: ({ params }) => (0, codegen_1._)`{passingSchemas: ${params.passing}}`
  };
  var def = {
    keyword: "oneOf",
    schemaType: "array",
    trackErrors: true,
    error,
    code(cxt) {
      const { gen, schema, parentSchema, it } = cxt;
      if (!Array.isArray(schema))
        throw new Error("ajv implementation error");
      if (it.opts.discriminator && parentSchema.discriminator)
        return;
      const schArr = schema;
      const valid = gen.let("valid", false);
      const passing = gen.let("passing", null);
      const schValid = gen.name("_valid");
      cxt.setParams({ passing });
      gen.block(validateOneOf);
      cxt.result(valid, () => cxt.reset(), () => cxt.error(true));
      function validateOneOf() {
        schArr.forEach((sch, i) => {
          let schCxt;
          if ((0, util_1.alwaysValidSchema)(it, sch)) {
            gen.var(schValid, true);
          } else {
            schCxt = cxt.subschema({
              keyword: "oneOf",
              schemaProp: i,
              compositeRule: true
            }, schValid);
          }
          if (i > 0) {
            gen.if((0, codegen_1._)`${schValid} && ${valid}`).assign(valid, false).assign(passing, (0, codegen_1._)`[${passing}, ${i}]`).else();
          }
          gen.if(schValid, () => {
            gen.assign(valid, true);
            gen.assign(passing, i);
            if (schCxt)
              cxt.mergeEvaluated(schCxt, codegen_1.Name);
          });
        });
      }
    }
  };
  exports.default = def;
});

// node_modules/.pnpm/ajv@8.17.1/node_modules/ajv/dist/vocabularies/applicator/allOf.js
var require_allOf = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var util_1 = require_util();
  var def = {
    keyword: "allOf",
    schemaType: "array",
    code(cxt) {
      const { gen, schema, it } = cxt;
      if (!Array.isArray(schema))
        throw new Error("ajv implementation error");
      const valid = gen.name("valid");
      schema.forEach((sch, i) => {
        if ((0, util_1.alwaysValidSchema)(it, sch))
          return;
        const schCxt = cxt.subschema({ keyword: "allOf", schemaProp: i }, valid);
        cxt.ok(valid);
        cxt.mergeEvaluated(schCxt);
      });
    }
  };
  exports.default = def;
});

// node_modules/.pnpm/ajv@8.17.1/node_modules/ajv/dist/vocabularies/applicator/if.js
var require_if = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  var error = {
    message: ({ params }) => (0, codegen_1.str)`must match "${params.ifClause}" schema`,
    params: ({ params }) => (0, codegen_1._)`{failingKeyword: ${params.ifClause}}`
  };
  var def = {
    keyword: "if",
    schemaType: ["object", "boolean"],
    trackErrors: true,
    error,
    code(cxt) {
      const { gen, parentSchema, it } = cxt;
      if (parentSchema.then === undefined && parentSchema.else === undefined) {
        (0, util_1.checkStrictMode)(it, '"if" without "then" and "else" is ignored');
      }
      const hasThen = hasSchema(it, "then");
      const hasElse = hasSchema(it, "else");
      if (!hasThen && !hasElse)
        return;
      const valid = gen.let("valid", true);
      const schValid = gen.name("_valid");
      validateIf();
      cxt.reset();
      if (hasThen && hasElse) {
        const ifClause = gen.let("ifClause");
        cxt.setParams({ ifClause });
        gen.if(schValid, validateClause("then", ifClause), validateClause("else", ifClause));
      } else if (hasThen) {
        gen.if(schValid, validateClause("then"));
      } else {
        gen.if((0, codegen_1.not)(schValid), validateClause("else"));
      }
      cxt.pass(valid, () => cxt.error(true));
      function validateIf() {
        const schCxt = cxt.subschema({
          keyword: "if",
          compositeRule: true,
          createErrors: false,
          allErrors: false
        }, schValid);
        cxt.mergeEvaluated(schCxt);
      }
      function validateClause(keyword, ifClause) {
        return () => {
          const schCxt = cxt.subschema({ keyword }, schValid);
          gen.assign(valid, schValid);
          cxt.mergeValidEvaluated(schCxt, valid);
          if (ifClause)
            gen.assign(ifClause, (0, codegen_1._)`${keyword}`);
          else
            cxt.setParams({ ifClause: keyword });
        };
      }
    }
  };
  function hasSchema(it, keyword) {
    const schema = it.schema[keyword];
    return schema !== undefined && !(0, util_1.alwaysValidSchema)(it, schema);
  }
  exports.default = def;
});

// node_modules/.pnpm/ajv@8.17.1/node_modules/ajv/dist/vocabularies/applicator/thenElse.js
var require_thenElse = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var util_1 = require_util();
  var def = {
    keyword: ["then", "else"],
    schemaType: ["object", "boolean"],
    code({ keyword, parentSchema, it }) {
      if (parentSchema.if === undefined)
        (0, util_1.checkStrictMode)(it, `"${keyword}" without "if" is ignored`);
    }
  };
  exports.default = def;
});

// node_modules/.pnpm/ajv@8.17.1/node_modules/ajv/dist/vocabularies/applicator/index.js
var require_applicator = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var additionalItems_1 = require_additionalItems();
  var prefixItems_1 = require_prefixItems();
  var items_1 = require_items();
  var items2020_1 = require_items2020();
  var contains_1 = require_contains();
  var dependencies_1 = require_dependencies();
  var propertyNames_1 = require_propertyNames();
  var additionalProperties_1 = require_additionalProperties();
  var properties_1 = require_properties();
  var patternProperties_1 = require_patternProperties();
  var not_1 = require_not();
  var anyOf_1 = require_anyOf();
  var oneOf_1 = require_oneOf();
  var allOf_1 = require_allOf();
  var if_1 = require_if();
  var thenElse_1 = require_thenElse();
  function getApplicator(draft2020 = false) {
    const applicator = [
      not_1.default,
      anyOf_1.default,
      oneOf_1.default,
      allOf_1.default,
      if_1.default,
      thenElse_1.default,
      propertyNames_1.default,
      additionalProperties_1.default,
      dependencies_1.default,
      properties_1.default,
      patternProperties_1.default
    ];
    if (draft2020)
      applicator.push(prefixItems_1.default, items2020_1.default);
    else
      applicator.push(additionalItems_1.default, items_1.default);
    applicator.push(contains_1.default);
    return applicator;
  }
  exports.default = getApplicator;
});

// node_modules/.pnpm/ajv@8.17.1/node_modules/ajv/dist/vocabularies/format/format.js
var require_format = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var codegen_1 = require_codegen();
  var error = {
    message: ({ schemaCode }) => (0, codegen_1.str)`must match format "${schemaCode}"`,
    params: ({ schemaCode }) => (0, codegen_1._)`{format: ${schemaCode}}`
  };
  var def = {
    keyword: "format",
    type: ["number", "string"],
    schemaType: "string",
    $data: true,
    error,
    code(cxt, ruleType) {
      const { gen, data, $data, schema, schemaCode, it } = cxt;
      const { opts, errSchemaPath, schemaEnv, self } = it;
      if (!opts.validateFormats)
        return;
      if ($data)
        validate$DataFormat();
      else
        validateFormat();
      function validate$DataFormat() {
        const fmts = gen.scopeValue("formats", {
          ref: self.formats,
          code: opts.code.formats
        });
        const fDef = gen.const("fDef", (0, codegen_1._)`${fmts}[${schemaCode}]`);
        const fType = gen.let("fType");
        const format = gen.let("format");
        gen.if((0, codegen_1._)`typeof ${fDef} == "object" && !(${fDef} instanceof RegExp)`, () => gen.assign(fType, (0, codegen_1._)`${fDef}.type || "string"`).assign(format, (0, codegen_1._)`${fDef}.validate`), () => gen.assign(fType, (0, codegen_1._)`"string"`).assign(format, fDef));
        cxt.fail$data((0, codegen_1.or)(unknownFmt(), invalidFmt()));
        function unknownFmt() {
          if (opts.strictSchema === false)
            return codegen_1.nil;
          return (0, codegen_1._)`${schemaCode} && !${format}`;
        }
        function invalidFmt() {
          const callFormat = schemaEnv.$async ? (0, codegen_1._)`(${fDef}.async ? await ${format}(${data}) : ${format}(${data}))` : (0, codegen_1._)`${format}(${data})`;
          const validData = (0, codegen_1._)`(typeof ${format} == "function" ? ${callFormat} : ${format}.test(${data}))`;
          return (0, codegen_1._)`${format} && ${format} !== true && ${fType} === ${ruleType} && !${validData}`;
        }
      }
      function validateFormat() {
        const formatDef = self.formats[schema];
        if (!formatDef) {
          unknownFormat();
          return;
        }
        if (formatDef === true)
          return;
        const [fmtType, format, fmtRef] = getFormat(formatDef);
        if (fmtType === ruleType)
          cxt.pass(validCondition());
        function unknownFormat() {
          if (opts.strictSchema === false) {
            self.logger.warn(unknownMsg());
            return;
          }
          throw new Error(unknownMsg());
          function unknownMsg() {
            return `unknown format "${schema}" ignored in schema at path "${errSchemaPath}"`;
          }
        }
        function getFormat(fmtDef) {
          const code = fmtDef instanceof RegExp ? (0, codegen_1.regexpCode)(fmtDef) : opts.code.formats ? (0, codegen_1._)`${opts.code.formats}${(0, codegen_1.getProperty)(schema)}` : undefined;
          const fmt = gen.scopeValue("formats", { key: schema, ref: fmtDef, code });
          if (typeof fmtDef == "object" && !(fmtDef instanceof RegExp)) {
            return [fmtDef.type || "string", fmtDef.validate, (0, codegen_1._)`${fmt}.validate`];
          }
          return ["string", fmtDef, fmt];
        }
        function validCondition() {
          if (typeof formatDef == "object" && !(formatDef instanceof RegExp) && formatDef.async) {
            if (!schemaEnv.$async)
              throw new Error("async format in sync schema");
            return (0, codegen_1._)`await ${fmtRef}(${data})`;
          }
          return typeof format == "function" ? (0, codegen_1._)`${fmtRef}(${data})` : (0, codegen_1._)`${fmtRef}.test(${data})`;
        }
      }
    }
  };
  exports.default = def;
});

// node_modules/.pnpm/ajv@8.17.1/node_modules/ajv/dist/vocabularies/format/index.js
var require_format2 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var format_1 = require_format();
  var format = [format_1.default];
  exports.default = format;
});

// node_modules/.pnpm/ajv@8.17.1/node_modules/ajv/dist/vocabularies/metadata.js
var require_metadata = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.contentVocabulary = exports.metadataVocabulary = undefined;
  exports.metadataVocabulary = [
    "title",
    "description",
    "default",
    "deprecated",
    "readOnly",
    "writeOnly",
    "examples"
  ];
  exports.contentVocabulary = [
    "contentMediaType",
    "contentEncoding",
    "contentSchema"
  ];
});

// node_modules/.pnpm/ajv@8.17.1/node_modules/ajv/dist/vocabularies/draft7.js
var require_draft7 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var core_1 = require_core2();
  var validation_1 = require_validation();
  var applicator_1 = require_applicator();
  var format_1 = require_format2();
  var metadata_1 = require_metadata();
  var draft7Vocabularies = [
    core_1.default,
    validation_1.default,
    (0, applicator_1.default)(),
    format_1.default,
    metadata_1.metadataVocabulary,
    metadata_1.contentVocabulary
  ];
  exports.default = draft7Vocabularies;
});

// node_modules/.pnpm/ajv@8.17.1/node_modules/ajv/dist/vocabularies/discriminator/types.js
var require_types = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.DiscrError = undefined;
  var DiscrError;
  (function(DiscrError2) {
    DiscrError2["Tag"] = "tag";
    DiscrError2["Mapping"] = "mapping";
  })(DiscrError || (exports.DiscrError = DiscrError = {}));
});

// node_modules/.pnpm/ajv@8.17.1/node_modules/ajv/dist/vocabularies/discriminator/index.js
var require_discriminator = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var codegen_1 = require_codegen();
  var types_1 = require_types();
  var compile_1 = require_compile();
  var ref_error_1 = require_ref_error();
  var util_1 = require_util();
  var error = {
    message: ({ params: { discrError, tagName } }) => discrError === types_1.DiscrError.Tag ? `tag "${tagName}" must be string` : `value of tag "${tagName}" must be in oneOf`,
    params: ({ params: { discrError, tag, tagName } }) => (0, codegen_1._)`{error: ${discrError}, tag: ${tagName}, tagValue: ${tag}}`
  };
  var def = {
    keyword: "discriminator",
    type: "object",
    schemaType: "object",
    error,
    code(cxt) {
      const { gen, data, schema, parentSchema, it } = cxt;
      const { oneOf } = parentSchema;
      if (!it.opts.discriminator) {
        throw new Error("discriminator: requires discriminator option");
      }
      const tagName = schema.propertyName;
      if (typeof tagName != "string")
        throw new Error("discriminator: requires propertyName");
      if (schema.mapping)
        throw new Error("discriminator: mapping is not supported");
      if (!oneOf)
        throw new Error("discriminator: requires oneOf keyword");
      const valid = gen.let("valid", false);
      const tag = gen.const("tag", (0, codegen_1._)`${data}${(0, codegen_1.getProperty)(tagName)}`);
      gen.if((0, codegen_1._)`typeof ${tag} == "string"`, () => validateMapping(), () => cxt.error(false, { discrError: types_1.DiscrError.Tag, tag, tagName }));
      cxt.ok(valid);
      function validateMapping() {
        const mapping = getMapping();
        gen.if(false);
        for (const tagValue in mapping) {
          gen.elseIf((0, codegen_1._)`${tag} === ${tagValue}`);
          gen.assign(valid, applyTagSchema(mapping[tagValue]));
        }
        gen.else();
        cxt.error(false, { discrError: types_1.DiscrError.Mapping, tag, tagName });
        gen.endIf();
      }
      function applyTagSchema(schemaProp) {
        const _valid = gen.name("valid");
        const schCxt = cxt.subschema({ keyword: "oneOf", schemaProp }, _valid);
        cxt.mergeEvaluated(schCxt, codegen_1.Name);
        return _valid;
      }
      function getMapping() {
        var _a;
        const oneOfMapping = {};
        const topRequired = hasRequired(parentSchema);
        let tagRequired = true;
        for (let i = 0;i < oneOf.length; i++) {
          let sch = oneOf[i];
          if ((sch === null || sch === undefined ? undefined : sch.$ref) && !(0, util_1.schemaHasRulesButRef)(sch, it.self.RULES)) {
            const ref = sch.$ref;
            sch = compile_1.resolveRef.call(it.self, it.schemaEnv.root, it.baseId, ref);
            if (sch instanceof compile_1.SchemaEnv)
              sch = sch.schema;
            if (sch === undefined)
              throw new ref_error_1.default(it.opts.uriResolver, it.baseId, ref);
          }
          const propSch = (_a = sch === null || sch === undefined ? undefined : sch.properties) === null || _a === undefined ? undefined : _a[tagName];
          if (typeof propSch != "object") {
            throw new Error(`discriminator: oneOf subschemas (or referenced schemas) must have "properties/${tagName}"`);
          }
          tagRequired = tagRequired && (topRequired || hasRequired(sch));
          addMappings(propSch, i);
        }
        if (!tagRequired)
          throw new Error(`discriminator: "${tagName}" must be required`);
        return oneOfMapping;
        function hasRequired({ required }) {
          return Array.isArray(required) && required.includes(tagName);
        }
        function addMappings(sch, i) {
          if (sch.const) {
            addMapping(sch.const, i);
          } else if (sch.enum) {
            for (const tagValue of sch.enum) {
              addMapping(tagValue, i);
            }
          } else {
            throw new Error(`discriminator: "properties/${tagName}" must have "const" or "enum"`);
          }
        }
        function addMapping(tagValue, i) {
          if (typeof tagValue != "string" || tagValue in oneOfMapping) {
            throw new Error(`discriminator: "${tagName}" values must be unique strings`);
          }
          oneOfMapping[tagValue] = i;
        }
      }
    }
  };
  exports.default = def;
});

// node_modules/.pnpm/ajv@8.17.1/node_modules/ajv/dist/refs/json-schema-draft-07.json
var require_json_schema_draft_07 = __commonJS((exports, module) => {
  module.exports = {
    $schema: "http://json-schema.org/draft-07/schema#",
    $id: "http://json-schema.org/draft-07/schema#",
    title: "Core schema meta-schema",
    definitions: {
      schemaArray: {
        type: "array",
        minItems: 1,
        items: { $ref: "#" }
      },
      nonNegativeInteger: {
        type: "integer",
        minimum: 0
      },
      nonNegativeIntegerDefault0: {
        allOf: [{ $ref: "#/definitions/nonNegativeInteger" }, { default: 0 }]
      },
      simpleTypes: {
        enum: ["array", "boolean", "integer", "null", "number", "object", "string"]
      },
      stringArray: {
        type: "array",
        items: { type: "string" },
        uniqueItems: true,
        default: []
      }
    },
    type: ["object", "boolean"],
    properties: {
      $id: {
        type: "string",
        format: "uri-reference"
      },
      $schema: {
        type: "string",
        format: "uri"
      },
      $ref: {
        type: "string",
        format: "uri-reference"
      },
      $comment: {
        type: "string"
      },
      title: {
        type: "string"
      },
      description: {
        type: "string"
      },
      default: true,
      readOnly: {
        type: "boolean",
        default: false
      },
      examples: {
        type: "array",
        items: true
      },
      multipleOf: {
        type: "number",
        exclusiveMinimum: 0
      },
      maximum: {
        type: "number"
      },
      exclusiveMaximum: {
        type: "number"
      },
      minimum: {
        type: "number"
      },
      exclusiveMinimum: {
        type: "number"
      },
      maxLength: { $ref: "#/definitions/nonNegativeInteger" },
      minLength: { $ref: "#/definitions/nonNegativeIntegerDefault0" },
      pattern: {
        type: "string",
        format: "regex"
      },
      additionalItems: { $ref: "#" },
      items: {
        anyOf: [{ $ref: "#" }, { $ref: "#/definitions/schemaArray" }],
        default: true
      },
      maxItems: { $ref: "#/definitions/nonNegativeInteger" },
      minItems: { $ref: "#/definitions/nonNegativeIntegerDefault0" },
      uniqueItems: {
        type: "boolean",
        default: false
      },
      contains: { $ref: "#" },
      maxProperties: { $ref: "#/definitions/nonNegativeInteger" },
      minProperties: { $ref: "#/definitions/nonNegativeIntegerDefault0" },
      required: { $ref: "#/definitions/stringArray" },
      additionalProperties: { $ref: "#" },
      definitions: {
        type: "object",
        additionalProperties: { $ref: "#" },
        default: {}
      },
      properties: {
        type: "object",
        additionalProperties: { $ref: "#" },
        default: {}
      },
      patternProperties: {
        type: "object",
        additionalProperties: { $ref: "#" },
        propertyNames: { format: "regex" },
        default: {}
      },
      dependencies: {
        type: "object",
        additionalProperties: {
          anyOf: [{ $ref: "#" }, { $ref: "#/definitions/stringArray" }]
        }
      },
      propertyNames: { $ref: "#" },
      const: true,
      enum: {
        type: "array",
        items: true,
        minItems: 1,
        uniqueItems: true
      },
      type: {
        anyOf: [
          { $ref: "#/definitions/simpleTypes" },
          {
            type: "array",
            items: { $ref: "#/definitions/simpleTypes" },
            minItems: 1,
            uniqueItems: true
          }
        ]
      },
      format: { type: "string" },
      contentMediaType: { type: "string" },
      contentEncoding: { type: "string" },
      if: { $ref: "#" },
      then: { $ref: "#" },
      else: { $ref: "#" },
      allOf: { $ref: "#/definitions/schemaArray" },
      anyOf: { $ref: "#/definitions/schemaArray" },
      oneOf: { $ref: "#/definitions/schemaArray" },
      not: { $ref: "#" }
    },
    default: true
  };
});

// node_modules/.pnpm/ajv@8.17.1/node_modules/ajv/dist/ajv.js
var require_ajv = __commonJS((exports, module) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.MissingRefError = exports.ValidationError = exports.CodeGen = exports.Name = exports.nil = exports.stringify = exports.str = exports._ = exports.KeywordCxt = exports.Ajv = undefined;
  var core_1 = require_core();
  var draft7_1 = require_draft7();
  var discriminator_1 = require_discriminator();
  var draft7MetaSchema = require_json_schema_draft_07();
  var META_SUPPORT_DATA = ["/properties"];
  var META_SCHEMA_ID = "http://json-schema.org/draft-07/schema";

  class Ajv extends core_1.default {
    _addVocabularies() {
      super._addVocabularies();
      draft7_1.default.forEach((v) => this.addVocabulary(v));
      if (this.opts.discriminator)
        this.addKeyword(discriminator_1.default);
    }
    _addDefaultMetaSchema() {
      super._addDefaultMetaSchema();
      if (!this.opts.meta)
        return;
      const metaSchema = this.opts.$data ? this.$dataMetaSchema(draft7MetaSchema, META_SUPPORT_DATA) : draft7MetaSchema;
      this.addMetaSchema(metaSchema, META_SCHEMA_ID, false);
      this.refs["http://json-schema.org/schema"] = META_SCHEMA_ID;
    }
    defaultMeta() {
      return this.opts.defaultMeta = super.defaultMeta() || (this.getSchema(META_SCHEMA_ID) ? META_SCHEMA_ID : undefined);
    }
  }
  exports.Ajv = Ajv;
  module.exports = exports = Ajv;
  module.exports.Ajv = Ajv;
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.default = Ajv;
  var validate_1 = require_validate();
  Object.defineProperty(exports, "KeywordCxt", { enumerable: true, get: function() {
    return validate_1.KeywordCxt;
  } });
  var codegen_1 = require_codegen();
  Object.defineProperty(exports, "_", { enumerable: true, get: function() {
    return codegen_1._;
  } });
  Object.defineProperty(exports, "str", { enumerable: true, get: function() {
    return codegen_1.str;
  } });
  Object.defineProperty(exports, "stringify", { enumerable: true, get: function() {
    return codegen_1.stringify;
  } });
  Object.defineProperty(exports, "nil", { enumerable: true, get: function() {
    return codegen_1.nil;
  } });
  Object.defineProperty(exports, "Name", { enumerable: true, get: function() {
    return codegen_1.Name;
  } });
  Object.defineProperty(exports, "CodeGen", { enumerable: true, get: function() {
    return codegen_1.CodeGen;
  } });
  var validation_error_1 = require_validation_error();
  Object.defineProperty(exports, "ValidationError", { enumerable: true, get: function() {
    return validation_error_1.default;
  } });
  var ref_error_1 = require_ref_error();
  Object.defineProperty(exports, "MissingRefError", { enumerable: true, get: function() {
    return ref_error_1.default;
  } });
});

// node_modules/.pnpm/fast-uri@2.4.0/node_modules/fast-uri/lib/scopedChars.js
var require_scopedChars2 = __commonJS((exports, module) => {
  var HEX = {
    0: 0,
    1: 1,
    2: 2,
    3: 3,
    4: 4,
    5: 5,
    6: 6,
    7: 7,
    8: 8,
    9: 9,
    a: 10,
    A: 10,
    b: 11,
    B: 11,
    c: 12,
    C: 12,
    d: 13,
    D: 13,
    e: 14,
    E: 14,
    f: 15,
    F: 15
  };
  module.exports = {
    HEX
  };
});

// node_modules/.pnpm/fast-uri@2.4.0/node_modules/fast-uri/lib/utils.js
var require_utils2 = __commonJS((exports, module) => {
  var { HEX } = require_scopedChars2();
  function normalizeIPv4(host) {
    if (findToken(host, ".") < 3) {
      return { host, isIPV4: false };
    }
    const matches = host.match(/^(\b[01]?\d{1,2}|\b2[0-4]\d|\b25[0-5])(\.([01]?\d{1,2}|2[0-4]\d|25[0-5])){3}$/u) || [];
    const [address] = matches;
    if (address) {
      return { host: stripLeadingZeros(address, "."), isIPV4: true };
    } else {
      return { host, isIPV4: false };
    }
  }
  function stringToHexStripped(input) {
    let acc = "";
    let strip = true;
    for (const c of input) {
      if (c !== "0" && strip === true)
        strip = false;
      if (HEX[c] === undefined)
        return;
      if (!strip)
        acc += c;
    }
    return acc;
  }
  function getIPV6(input) {
    let tokenCount = 0;
    const output = { error: false, address: "", zone: "" };
    const address = [];
    const buffer = [];
    let isZone = false;
    let endipv6Encountered = false;
    let endIpv6 = false;
    function consume() {
      if (buffer.length) {
        if (isZone === false) {
          const hex = stringToHexStripped(buffer.join(""));
          if (hex !== undefined) {
            address.push(hex);
          } else {
            output.error = true;
            return false;
          }
        }
        buffer.length = 0;
      }
      return true;
    }
    for (let i = 0;i < input.length; i++) {
      const cursor = input[i];
      if (cursor === "[" || cursor === "]") {
        continue;
      }
      if (cursor === ":") {
        if (endipv6Encountered === true) {
          endIpv6 = true;
        }
        if (!consume()) {
          break;
        }
        tokenCount++;
        address.push(":");
        if (tokenCount > 7) {
          output.error = true;
          break;
        }
        if (i - 1 >= 0 && input[i - 1] === ":") {
          endipv6Encountered = true;
        }
        continue;
      } else if (cursor === "%") {
        if (!consume()) {
          break;
        }
        isZone = true;
      } else {
        buffer.push(cursor);
        continue;
      }
    }
    if (buffer.length) {
      if (isZone) {
        output.zone = buffer.join("");
      } else if (endIpv6) {
        address.push(buffer.join(""));
      } else {
        address.push(stringToHexStripped(buffer.join("")));
      }
    }
    output.address = address.join("");
    return output;
  }
  function normalizeIPv6(host, opts = {}) {
    if (findToken(host, ":") < 2) {
      return { host, isIPV6: false };
    }
    const ipv6 = getIPV6(host);
    if (!ipv6.error) {
      let newHost = ipv6.address;
      let escapedHost = ipv6.address;
      if (ipv6.zone) {
        newHost += "%" + ipv6.zone;
        escapedHost += "%25" + ipv6.zone;
      }
      return { host: newHost, escapedHost, isIPV6: true };
    } else {
      return { host, isIPV6: false };
    }
  }
  function stripLeadingZeros(str, token) {
    let out = "";
    let skip = true;
    const l = str.length;
    for (let i = 0;i < l; i++) {
      const c = str[i];
      if (c === "0" && skip) {
        if (i + 1 <= l && str[i + 1] === token || i + 1 === l) {
          out += c;
          skip = false;
        }
      } else {
        if (c === token) {
          skip = true;
        } else {
          skip = false;
        }
        out += c;
      }
    }
    return out;
  }
  function findToken(str, token) {
    let ind = 0;
    for (let i = 0;i < str.length; i++) {
      if (str[i] === token)
        ind++;
    }
    return ind;
  }
  var RDS1 = /^\.\.?\//u;
  var RDS2 = /^\/\.(?:\/|$)/u;
  var RDS3 = /^\/\.\.(?:\/|$)/u;
  var RDS5 = /^\/?(?:.|\n)*?(?=\/|$)/u;
  function removeDotSegments(input) {
    const output = [];
    while (input.length) {
      if (input.match(RDS1)) {
        input = input.replace(RDS1, "");
      } else if (input.match(RDS2)) {
        input = input.replace(RDS2, "/");
      } else if (input.match(RDS3)) {
        input = input.replace(RDS3, "/");
        output.pop();
      } else if (input === "." || input === "..") {
        input = "";
      } else {
        const im = input.match(RDS5);
        if (im) {
          const s = im[0];
          input = input.slice(s.length);
          output.push(s);
        } else {
          throw new Error("Unexpected dot segment condition");
        }
      }
    }
    return output.join("");
  }
  function normalizeComponentEncoding(components, esc) {
    const func = esc !== true ? escape : unescape;
    if (components.scheme !== undefined) {
      components.scheme = func(components.scheme);
    }
    if (components.userinfo !== undefined) {
      components.userinfo = func(components.userinfo);
    }
    if (components.host !== undefined) {
      components.host = func(components.host);
    }
    if (components.path !== undefined) {
      components.path = func(components.path);
    }
    if (components.query !== undefined) {
      components.query = func(components.query);
    }
    if (components.fragment !== undefined) {
      components.fragment = func(components.fragment);
    }
    return components;
  }
  function recomposeAuthority(components, options) {
    const uriTokens = [];
    if (components.userinfo !== undefined) {
      uriTokens.push(components.userinfo);
      uriTokens.push("@");
    }
    if (components.host !== undefined) {
      let host = unescape(components.host);
      const ipV4res = normalizeIPv4(host);
      if (ipV4res.isIPV4) {
        host = ipV4res.host;
      } else {
        const ipV6res = normalizeIPv6(ipV4res.host, { isIPV4: false });
        if (ipV6res.isIPV6 === true) {
          host = `[${ipV6res.escapedHost}]`;
        } else {
          host = components.host;
        }
      }
      uriTokens.push(host);
    }
    if (typeof components.port === "number" || typeof components.port === "string") {
      uriTokens.push(":");
      uriTokens.push(String(components.port));
    }
    return uriTokens.length ? uriTokens.join("") : undefined;
  }
  module.exports = {
    recomposeAuthority,
    normalizeComponentEncoding,
    removeDotSegments,
    normalizeIPv4,
    normalizeIPv6,
    stringToHexStripped
  };
});

// node_modules/.pnpm/fast-uri@2.4.0/node_modules/fast-uri/lib/schemes.js
var require_schemes2 = __commonJS((exports, module) => {
  var UUID_REG = /^[\da-f]{8}\b-[\da-f]{4}\b-[\da-f]{4}\b-[\da-f]{4}\b-[\da-f]{12}$/iu;
  var URN_REG = /([\da-z][\d\-a-z]{0,31}):((?:[\w!$'()*+,\-.:;=@]|%[\da-f]{2})+)/iu;
  function isSecure(wsComponents) {
    return typeof wsComponents.secure === "boolean" ? wsComponents.secure : String(wsComponents.scheme).toLowerCase() === "wss";
  }
  function httpParse(components) {
    if (!components.host) {
      components.error = components.error || "HTTP URIs must have a host.";
    }
    return components;
  }
  function httpSerialize(components) {
    const secure = String(components.scheme).toLowerCase() === "https";
    if (components.port === (secure ? 443 : 80) || components.port === "") {
      components.port = undefined;
    }
    if (!components.path) {
      components.path = "/";
    }
    return components;
  }
  function wsParse(wsComponents) {
    wsComponents.secure = isSecure(wsComponents);
    wsComponents.resourceName = (wsComponents.path || "/") + (wsComponents.query ? "?" + wsComponents.query : "");
    wsComponents.path = undefined;
    wsComponents.query = undefined;
    return wsComponents;
  }
  function wsSerialize(wsComponents) {
    if (wsComponents.port === (isSecure(wsComponents) ? 443 : 80) || wsComponents.port === "") {
      wsComponents.port = undefined;
    }
    if (typeof wsComponents.secure === "boolean") {
      wsComponents.scheme = wsComponents.secure ? "wss" : "ws";
      wsComponents.secure = undefined;
    }
    if (wsComponents.resourceName) {
      const [path, query] = wsComponents.resourceName.split("?");
      wsComponents.path = path && path !== "/" ? path : undefined;
      wsComponents.query = query;
      wsComponents.resourceName = undefined;
    }
    wsComponents.fragment = undefined;
    return wsComponents;
  }
  function urnParse(urnComponents, options) {
    if (!urnComponents.path) {
      urnComponents.error = "URN can not be parsed";
      return urnComponents;
    }
    const matches = urnComponents.path.match(URN_REG);
    if (matches) {
      const scheme = options.scheme || urnComponents.scheme || "urn";
      urnComponents.nid = matches[1].toLowerCase();
      urnComponents.nss = matches[2];
      const urnScheme = `${scheme}:${options.nid || urnComponents.nid}`;
      const schemeHandler = SCHEMES[urnScheme];
      urnComponents.path = undefined;
      if (schemeHandler) {
        urnComponents = schemeHandler.parse(urnComponents, options);
      }
    } else {
      urnComponents.error = urnComponents.error || "URN can not be parsed.";
    }
    return urnComponents;
  }
  function urnSerialize(urnComponents, options) {
    const scheme = options.scheme || urnComponents.scheme || "urn";
    const nid = urnComponents.nid.toLowerCase();
    const urnScheme = `${scheme}:${options.nid || nid}`;
    const schemeHandler = SCHEMES[urnScheme];
    if (schemeHandler) {
      urnComponents = schemeHandler.serialize(urnComponents, options);
    }
    const uriComponents = urnComponents;
    const nss = urnComponents.nss;
    uriComponents.path = `${nid || options.nid}:${nss}`;
    options.skipEscape = true;
    return uriComponents;
  }
  function urnuuidParse(urnComponents, options) {
    const uuidComponents = urnComponents;
    uuidComponents.uuid = uuidComponents.nss;
    uuidComponents.nss = undefined;
    if (!options.tolerant && (!uuidComponents.uuid || !UUID_REG.test(uuidComponents.uuid))) {
      uuidComponents.error = uuidComponents.error || "UUID is not valid.";
    }
    return uuidComponents;
  }
  function urnuuidSerialize(uuidComponents) {
    const urnComponents = uuidComponents;
    urnComponents.nss = (uuidComponents.uuid || "").toLowerCase();
    return urnComponents;
  }
  var http = {
    scheme: "http",
    domainHost: true,
    parse: httpParse,
    serialize: httpSerialize
  };
  var https = {
    scheme: "https",
    domainHost: http.domainHost,
    parse: httpParse,
    serialize: httpSerialize
  };
  var ws = {
    scheme: "ws",
    domainHost: true,
    parse: wsParse,
    serialize: wsSerialize
  };
  var wss = {
    scheme: "wss",
    domainHost: ws.domainHost,
    parse: ws.parse,
    serialize: ws.serialize
  };
  var urn = {
    scheme: "urn",
    parse: urnParse,
    serialize: urnSerialize,
    skipNormalize: true
  };
  var urnuuid = {
    scheme: "urn:uuid",
    parse: urnuuidParse,
    serialize: urnuuidSerialize,
    skipNormalize: true
  };
  var SCHEMES = {
    http,
    https,
    ws,
    wss,
    urn,
    "urn:uuid": urnuuid
  };
  module.exports = SCHEMES;
});

// node_modules/.pnpm/fast-uri@2.4.0/node_modules/fast-uri/index.js
var require_fast_uri2 = __commonJS((exports, module) => {
  var { normalizeIPv6, normalizeIPv4, removeDotSegments, recomposeAuthority, normalizeComponentEncoding } = require_utils2();
  var SCHEMES = require_schemes2();
  function normalize(uri, options) {
    if (typeof uri === "string") {
      uri = serialize(parse(uri, options), options);
    } else if (typeof uri === "object") {
      uri = parse(serialize(uri, options), options);
    }
    return uri;
  }
  function resolve(baseURI, relativeURI, options) {
    const schemelessOptions = Object.assign({ scheme: "null" }, options);
    const resolved = resolveComponents(parse(baseURI, schemelessOptions), parse(relativeURI, schemelessOptions), schemelessOptions, true);
    return serialize(resolved, { ...schemelessOptions, skipEscape: true });
  }
  function resolveComponents(base, relative, options, skipNormalization) {
    const target = {};
    if (!skipNormalization) {
      base = parse(serialize(base, options), options);
      relative = parse(serialize(relative, options), options);
    }
    options = options || {};
    if (!options.tolerant && relative.scheme) {
      target.scheme = relative.scheme;
      target.userinfo = relative.userinfo;
      target.host = relative.host;
      target.port = relative.port;
      target.path = removeDotSegments(relative.path || "");
      target.query = relative.query;
    } else {
      if (relative.userinfo !== undefined || relative.host !== undefined || relative.port !== undefined) {
        target.userinfo = relative.userinfo;
        target.host = relative.host;
        target.port = relative.port;
        target.path = removeDotSegments(relative.path || "");
        target.query = relative.query;
      } else {
        if (!relative.path) {
          target.path = base.path;
          if (relative.query !== undefined) {
            target.query = relative.query;
          } else {
            target.query = base.query;
          }
        } else {
          if (relative.path.charAt(0) === "/") {
            target.path = removeDotSegments(relative.path);
          } else {
            if ((base.userinfo !== undefined || base.host !== undefined || base.port !== undefined) && !base.path) {
              target.path = "/" + relative.path;
            } else if (!base.path) {
              target.path = relative.path;
            } else {
              target.path = base.path.slice(0, base.path.lastIndexOf("/") + 1) + relative.path;
            }
            target.path = removeDotSegments(target.path);
          }
          target.query = relative.query;
        }
        target.userinfo = base.userinfo;
        target.host = base.host;
        target.port = base.port;
      }
      target.scheme = base.scheme;
    }
    target.fragment = relative.fragment;
    return target;
  }
  function equal(uriA, uriB, options) {
    if (typeof uriA === "string") {
      uriA = unescape(uriA);
      uriA = serialize(normalizeComponentEncoding(parse(uriA, options), true), { ...options, skipEscape: true });
    } else if (typeof uriA === "object") {
      uriA = serialize(normalizeComponentEncoding(uriA, true), { ...options, skipEscape: true });
    }
    if (typeof uriB === "string") {
      uriB = unescape(uriB);
      uriB = serialize(normalizeComponentEncoding(parse(uriB, options), true), { ...options, skipEscape: true });
    } else if (typeof uriB === "object") {
      uriB = serialize(normalizeComponentEncoding(uriB, true), { ...options, skipEscape: true });
    }
    return uriA.toLowerCase() === uriB.toLowerCase();
  }
  function serialize(cmpts, opts) {
    const components = {
      host: cmpts.host,
      scheme: cmpts.scheme,
      userinfo: cmpts.userinfo,
      port: cmpts.port,
      path: cmpts.path,
      query: cmpts.query,
      nid: cmpts.nid,
      nss: cmpts.nss,
      uuid: cmpts.uuid,
      fragment: cmpts.fragment,
      reference: cmpts.reference,
      resourceName: cmpts.resourceName,
      secure: cmpts.secure,
      error: ""
    };
    const options = Object.assign({}, opts);
    const uriTokens = [];
    const schemeHandler = SCHEMES[(options.scheme || components.scheme || "").toLowerCase()];
    if (schemeHandler && schemeHandler.serialize)
      schemeHandler.serialize(components, options);
    if (components.path !== undefined) {
      if (!options.skipEscape) {
        components.path = escape(components.path);
        if (components.scheme !== undefined) {
          components.path = components.path.split("%3A").join(":");
        }
      } else {
        components.path = unescape(components.path);
      }
    }
    if (options.reference !== "suffix" && components.scheme) {
      uriTokens.push(components.scheme);
      uriTokens.push(":");
    }
    const authority = recomposeAuthority(components, options);
    if (authority !== undefined) {
      if (options.reference !== "suffix") {
        uriTokens.push("//");
      }
      uriTokens.push(authority);
      if (components.path && components.path.charAt(0) !== "/") {
        uriTokens.push("/");
      }
    }
    if (components.path !== undefined) {
      let s = components.path;
      if (!options.absolutePath && (!schemeHandler || !schemeHandler.absolutePath)) {
        s = removeDotSegments(s);
      }
      if (authority === undefined) {
        s = s.replace(/^\/\//u, "/%2F");
      }
      uriTokens.push(s);
    }
    if (components.query !== undefined) {
      uriTokens.push("?");
      uriTokens.push(components.query);
    }
    if (components.fragment !== undefined) {
      uriTokens.push("#");
      uriTokens.push(components.fragment);
    }
    return uriTokens.join("");
  }
  var hexLookUp = Array.from({ length: 127 }, (v, k) => /[^!"$&'()*+,\-.;=_`a-z{}~]/u.test(String.fromCharCode(k)));
  function nonSimpleDomain(value) {
    let code = 0;
    for (let i = 0, len = value.length;i < len; ++i) {
      code = value.charCodeAt(i);
      if (code > 126 || hexLookUp[code]) {
        return true;
      }
    }
    return false;
  }
  var URI_PARSE = /^(?:([^#/:?]+):)?(?:\/\/((?:([^#/?@]*)@)?(\[[^#/?\]]+\]|[^#/:?]*)(?::(\d*))?))?([^#?]*)(?:\?([^#]*))?(?:#((?:.|[\n\r])*))?/u;
  function parse(uri, opts) {
    const options = Object.assign({}, opts);
    const parsed = {
      scheme: undefined,
      userinfo: undefined,
      host: "",
      port: undefined,
      path: "",
      query: undefined,
      fragment: undefined
    };
    const gotEncoding = uri.indexOf("%") !== -1;
    if (options.reference === "suffix")
      uri = (options.scheme ? options.scheme + ":" : "") + "//" + uri;
    const matches = uri.match(URI_PARSE);
    if (matches) {
      parsed.scheme = matches[1];
      parsed.userinfo = matches[3];
      parsed.host = matches[4];
      parsed.port = parseInt(matches[5], 10);
      parsed.path = matches[6] || "";
      parsed.query = matches[7];
      parsed.fragment = matches[8];
      if (isNaN(parsed.port)) {
        parsed.port = matches[5];
      }
      if (parsed.host) {
        const ipv4result = normalizeIPv4(parsed.host);
        if (ipv4result.isIPV4 === false) {
          parsed.host = normalizeIPv6(ipv4result.host, { isIPV4: false }).host.toLowerCase();
        } else {
          parsed.host = ipv4result.host;
        }
      }
      if (parsed.scheme === undefined && parsed.userinfo === undefined && parsed.host === undefined && parsed.port === undefined && !parsed.path && parsed.query === undefined) {
        parsed.reference = "same-document";
      } else if (parsed.scheme === undefined) {
        parsed.reference = "relative";
      } else if (parsed.fragment === undefined) {
        parsed.reference = "absolute";
      } else {
        parsed.reference = "uri";
      }
      if (options.reference && options.reference !== "suffix" && options.reference !== parsed.reference) {
        parsed.error = parsed.error || "URI is not a " + options.reference + " reference.";
      }
      const schemeHandler = SCHEMES[(options.scheme || parsed.scheme || "").toLowerCase()];
      if (!options.unicodeSupport && (!schemeHandler || !schemeHandler.unicodeSupport)) {
        if (parsed.host && (options.domainHost || schemeHandler && schemeHandler.domainHost) && nonSimpleDomain(parsed.host)) {
          try {
            parsed.host = URL.domainToASCII(parsed.host.toLowerCase());
          } catch (e) {
            parsed.error = parsed.error || "Host's domain name can not be converted to ASCII: " + e;
          }
        }
      }
      if (!schemeHandler || schemeHandler && !schemeHandler.skipNormalize) {
        if (gotEncoding && parsed.scheme !== undefined) {
          parsed.scheme = unescape(parsed.scheme);
        }
        if (gotEncoding && parsed.userinfo !== undefined) {
          parsed.userinfo = unescape(parsed.userinfo);
        }
        if (gotEncoding && parsed.host !== undefined) {
          parsed.host = unescape(parsed.host);
        }
        if (parsed.path !== undefined && parsed.path.length) {
          parsed.path = escape(unescape(parsed.path));
        }
        if (parsed.fragment !== undefined && parsed.fragment.length) {
          parsed.fragment = encodeURI(decodeURI(parsed.fragment));
        }
      }
      if (schemeHandler && schemeHandler.parse) {
        schemeHandler.parse(parsed, options);
      }
    } else {
      parsed.error = parsed.error || "URI can not be parsed.";
    }
    return parsed;
  }
  var fastUri = {
    normalize,
    resolve,
    resolveComponents,
    equal,
    serialize,
    parse
  };
  module.exports = fastUri;
  module.exports.default = fastUri;
  module.exports.fastUri = fastUri;
});

// node_modules/.pnpm/ajv-formats@3.0.1_ajv@8.17.1/node_modules/ajv-formats/dist/formats.js
var require_formats = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.formatNames = exports.fastFormats = exports.fullFormats = undefined;
  function fmtDef(validate, compare) {
    return { validate, compare };
  }
  exports.fullFormats = {
    date: fmtDef(date, compareDate),
    time: fmtDef(getTime(true), compareTime),
    "date-time": fmtDef(getDateTime(true), compareDateTime),
    "iso-time": fmtDef(getTime(), compareIsoTime),
    "iso-date-time": fmtDef(getDateTime(), compareIsoDateTime),
    duration: /^P(?!$)((\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+S)?)?|(\d+W)?)$/,
    uri,
    "uri-reference": /^(?:[a-z][a-z0-9+\-.]*:)?(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'"()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?(?:\?(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i,
    "uri-template": /^(?:(?:[^\x00-\x20"'<>%\\^`{|}]|%[0-9a-f]{2})|\{[+#./;?&=,!@|]?(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?(?:,(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?)*\})*$/i,
    url: /^(?:https?|ftp):\/\/(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u{00a1}-\u{ffff}]+-)*[a-z0-9\u{00a1}-\u{ffff}]+)(?:\.(?:[a-z0-9\u{00a1}-\u{ffff}]+-)*[a-z0-9\u{00a1}-\u{ffff}]+)*(?:\.(?:[a-z\u{00a1}-\u{ffff}]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/iu,
    email: /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i,
    hostname: /^(?=.{1,253}\.?$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[-0-9a-z]{0,61}[0-9a-z])?)*\.?$/i,
    ipv4: /^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/,
    ipv6: /^((([0-9a-f]{1,4}:){7}([0-9a-f]{1,4}|:))|(([0-9a-f]{1,4}:){6}(:[0-9a-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){5}(((:[0-9a-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){4}(((:[0-9a-f]{1,4}){1,3})|((:[0-9a-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){3}(((:[0-9a-f]{1,4}){1,4})|((:[0-9a-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){2}(((:[0-9a-f]{1,4}){1,5})|((:[0-9a-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){1}(((:[0-9a-f]{1,4}){1,6})|((:[0-9a-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9a-f]{1,4}){1,7})|((:[0-9a-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))$/i,
    regex,
    uuid: /^(?:urn:uuid:)?[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i,
    "json-pointer": /^(?:\/(?:[^~/]|~0|~1)*)*$/,
    "json-pointer-uri-fragment": /^#(?:\/(?:[a-z0-9_\-.!$&'()*+,;:=@]|%[0-9a-f]{2}|~0|~1)*)*$/i,
    "relative-json-pointer": /^(?:0|[1-9][0-9]*)(?:#|(?:\/(?:[^~/]|~0|~1)*)*)$/,
    byte,
    int32: { type: "number", validate: validateInt32 },
    int64: { type: "number", validate: validateInt64 },
    float: { type: "number", validate: validateNumber },
    double: { type: "number", validate: validateNumber },
    password: true,
    binary: true
  };
  exports.fastFormats = {
    ...exports.fullFormats,
    date: fmtDef(/^\d\d\d\d-[0-1]\d-[0-3]\d$/, compareDate),
    time: fmtDef(/^(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)$/i, compareTime),
    "date-time": fmtDef(/^\d\d\d\d-[0-1]\d-[0-3]\dt(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)$/i, compareDateTime),
    "iso-time": fmtDef(/^(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)?$/i, compareIsoTime),
    "iso-date-time": fmtDef(/^\d\d\d\d-[0-1]\d-[0-3]\d[t\s](?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)?$/i, compareIsoDateTime),
    uri: /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/)?[^\s]*$/i,
    "uri-reference": /^(?:(?:[a-z][a-z0-9+\-.]*:)?\/?\/)?(?:[^\\\s#][^\s#]*)?(?:#[^\\\s]*)?$/i,
    email: /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/i
  };
  exports.formatNames = Object.keys(exports.fullFormats);
  function isLeapYear(year) {
    return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  }
  var DATE = /^(\d\d\d\d)-(\d\d)-(\d\d)$/;
  var DAYS = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  function date(str) {
    const matches = DATE.exec(str);
    if (!matches)
      return false;
    const year = +matches[1];
    const month = +matches[2];
    const day = +matches[3];
    return month >= 1 && month <= 12 && day >= 1 && day <= (month === 2 && isLeapYear(year) ? 29 : DAYS[month]);
  }
  function compareDate(d1, d2) {
    if (!(d1 && d2))
      return;
    if (d1 > d2)
      return 1;
    if (d1 < d2)
      return -1;
    return 0;
  }
  var TIME = /^(\d\d):(\d\d):(\d\d(?:\.\d+)?)(z|([+-])(\d\d)(?::?(\d\d))?)?$/i;
  function getTime(strictTimeZone) {
    return function time(str) {
      const matches = TIME.exec(str);
      if (!matches)
        return false;
      const hr = +matches[1];
      const min = +matches[2];
      const sec = +matches[3];
      const tz = matches[4];
      const tzSign = matches[5] === "-" ? -1 : 1;
      const tzH = +(matches[6] || 0);
      const tzM = +(matches[7] || 0);
      if (tzH > 23 || tzM > 59 || strictTimeZone && !tz)
        return false;
      if (hr <= 23 && min <= 59 && sec < 60)
        return true;
      const utcMin = min - tzM * tzSign;
      const utcHr = hr - tzH * tzSign - (utcMin < 0 ? 1 : 0);
      return (utcHr === 23 || utcHr === -1) && (utcMin === 59 || utcMin === -1) && sec < 61;
    };
  }
  function compareTime(s1, s2) {
    if (!(s1 && s2))
      return;
    const t1 = new Date("2020-01-01T" + s1).valueOf();
    const t2 = new Date("2020-01-01T" + s2).valueOf();
    if (!(t1 && t2))
      return;
    return t1 - t2;
  }
  function compareIsoTime(t1, t2) {
    if (!(t1 && t2))
      return;
    const a1 = TIME.exec(t1);
    const a2 = TIME.exec(t2);
    if (!(a1 && a2))
      return;
    t1 = a1[1] + a1[2] + a1[3];
    t2 = a2[1] + a2[2] + a2[3];
    if (t1 > t2)
      return 1;
    if (t1 < t2)
      return -1;
    return 0;
  }
  var DATE_TIME_SEPARATOR = /t|\s/i;
  function getDateTime(strictTimeZone) {
    const time = getTime(strictTimeZone);
    return function date_time(str) {
      const dateTime = str.split(DATE_TIME_SEPARATOR);
      return dateTime.length === 2 && date(dateTime[0]) && time(dateTime[1]);
    };
  }
  function compareDateTime(dt1, dt2) {
    if (!(dt1 && dt2))
      return;
    const d1 = new Date(dt1).valueOf();
    const d2 = new Date(dt2).valueOf();
    if (!(d1 && d2))
      return;
    return d1 - d2;
  }
  function compareIsoDateTime(dt1, dt2) {
    if (!(dt1 && dt2))
      return;
    const [d1, t1] = dt1.split(DATE_TIME_SEPARATOR);
    const [d2, t2] = dt2.split(DATE_TIME_SEPARATOR);
    const res = compareDate(d1, d2);
    if (res === undefined)
      return;
    return res || compareTime(t1, t2);
  }
  var NOT_URI_FRAGMENT = /\/|:/;
  var URI = /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)(?:\?(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i;
  function uri(str) {
    return NOT_URI_FRAGMENT.test(str) && URI.test(str);
  }
  var BYTE = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/gm;
  function byte(str) {
    BYTE.lastIndex = 0;
    return BYTE.test(str);
  }
  var MIN_INT32 = -(2 ** 31);
  var MAX_INT32 = 2 ** 31 - 1;
  function validateInt32(value) {
    return Number.isInteger(value) && value <= MAX_INT32 && value >= MIN_INT32;
  }
  function validateInt64(value) {
    return Number.isInteger(value);
  }
  function validateNumber() {
    return true;
  }
  var Z_ANCHOR = /[^\\]\\Z/;
  function regex(str) {
    if (Z_ANCHOR.test(str))
      return false;
    try {
      new RegExp(str);
      return true;
    } catch (e) {
      return false;
    }
  }
});

// node_modules/.pnpm/ajv-formats@3.0.1_ajv@8.17.1/node_modules/ajv-formats/dist/limit.js
var require_limit = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.formatLimitDefinition = undefined;
  var ajv_1 = require_ajv();
  var codegen_1 = require_codegen();
  var ops = codegen_1.operators;
  var KWDs = {
    formatMaximum: { okStr: "<=", ok: ops.LTE, fail: ops.GT },
    formatMinimum: { okStr: ">=", ok: ops.GTE, fail: ops.LT },
    formatExclusiveMaximum: { okStr: "<", ok: ops.LT, fail: ops.GTE },
    formatExclusiveMinimum: { okStr: ">", ok: ops.GT, fail: ops.LTE }
  };
  var error = {
    message: ({ keyword, schemaCode }) => (0, codegen_1.str)`should be ${KWDs[keyword].okStr} ${schemaCode}`,
    params: ({ keyword, schemaCode }) => (0, codegen_1._)`{comparison: ${KWDs[keyword].okStr}, limit: ${schemaCode}}`
  };
  exports.formatLimitDefinition = {
    keyword: Object.keys(KWDs),
    type: "string",
    schemaType: "string",
    $data: true,
    error,
    code(cxt) {
      const { gen, data, schemaCode, keyword, it } = cxt;
      const { opts, self } = it;
      if (!opts.validateFormats)
        return;
      const fCxt = new ajv_1.KeywordCxt(it, self.RULES.all.format.definition, "format");
      if (fCxt.$data)
        validate$DataFormat();
      else
        validateFormat();
      function validate$DataFormat() {
        const fmts = gen.scopeValue("formats", {
          ref: self.formats,
          code: opts.code.formats
        });
        const fmt = gen.const("fmt", (0, codegen_1._)`${fmts}[${fCxt.schemaCode}]`);
        cxt.fail$data((0, codegen_1.or)((0, codegen_1._)`typeof ${fmt} != "object"`, (0, codegen_1._)`${fmt} instanceof RegExp`, (0, codegen_1._)`typeof ${fmt}.compare != "function"`, compareCode(fmt)));
      }
      function validateFormat() {
        const format = fCxt.schema;
        const fmtDef = self.formats[format];
        if (!fmtDef || fmtDef === true)
          return;
        if (typeof fmtDef != "object" || fmtDef instanceof RegExp || typeof fmtDef.compare != "function") {
          throw new Error(`"${keyword}": format "${format}" does not define "compare" function`);
        }
        const fmt = gen.scopeValue("formats", {
          key: format,
          ref: fmtDef,
          code: opts.code.formats ? (0, codegen_1._)`${opts.code.formats}${(0, codegen_1.getProperty)(format)}` : undefined
        });
        cxt.fail$data(compareCode(fmt));
      }
      function compareCode(fmt) {
        return (0, codegen_1._)`${fmt}.compare(${data}, ${schemaCode}) ${KWDs[keyword].fail} 0`;
      }
    },
    dependencies: ["format"]
  };
  var formatLimitPlugin = (ajv) => {
    ajv.addKeyword(exports.formatLimitDefinition);
    return ajv;
  };
  exports.default = formatLimitPlugin;
});

// node_modules/.pnpm/ajv-formats@3.0.1_ajv@8.17.1/node_modules/ajv-formats/dist/index.js
var require_dist = __commonJS((exports, module) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var formats_1 = require_formats();
  var limit_1 = require_limit();
  var codegen_1 = require_codegen();
  var fullName = new codegen_1.Name("fullFormats");
  var fastName = new codegen_1.Name("fastFormats");
  var formatsPlugin = (ajv, opts = { keywords: true }) => {
    if (Array.isArray(opts)) {
      addFormats(ajv, opts, formats_1.fullFormats, fullName);
      return ajv;
    }
    const [formats, exportName] = opts.mode === "fast" ? [formats_1.fastFormats, fastName] : [formats_1.fullFormats, fullName];
    const list = opts.formats || formats_1.formatNames;
    addFormats(ajv, list, formats, exportName);
    if (opts.keywords)
      (0, limit_1.default)(ajv);
    return ajv;
  };
  formatsPlugin.get = (name, mode = "full") => {
    const formats = mode === "fast" ? formats_1.fastFormats : formats_1.fullFormats;
    const f = formats[name];
    if (!f)
      throw new Error(`Unknown format "${name}"`);
    return f;
  };
  function addFormats(ajv, list, fs, exportName) {
    var _a;
    var _b;
    (_a = (_b = ajv.opts.code).formats) !== null && _a !== undefined || (_b.formats = (0, codegen_1._)`require("ajv-formats/dist/formats").${exportName}`);
    for (const f of list)
      ajv.addFormat(f, fs[f]);
  }
  module.exports = exports = formatsPlugin;
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.default = formatsPlugin;
});

// node_modules/.pnpm/rfdc@1.4.1/node_modules/rfdc/index.js
var require_rfdc = __commonJS((exports, module) => {
  module.exports = rfdc;
  function copyBuffer(cur) {
    if (cur instanceof Buffer) {
      return Buffer.from(cur);
    }
    return new cur.constructor(cur.buffer.slice(), cur.byteOffset, cur.length);
  }
  function rfdc(opts) {
    opts = opts || {};
    if (opts.circles)
      return rfdcCircles(opts);
    const constructorHandlers = new Map;
    constructorHandlers.set(Date, (o) => new Date(o));
    constructorHandlers.set(Map, (o, fn) => new Map(cloneArray(Array.from(o), fn)));
    constructorHandlers.set(Set, (o, fn) => new Set(cloneArray(Array.from(o), fn)));
    if (opts.constructorHandlers) {
      for (const handler2 of opts.constructorHandlers) {
        constructorHandlers.set(handler2[0], handler2[1]);
      }
    }
    let handler = null;
    return opts.proto ? cloneProto : clone;
    function cloneArray(a, fn) {
      const keys = Object.keys(a);
      const a2 = new Array(keys.length);
      for (let i = 0;i < keys.length; i++) {
        const k = keys[i];
        const cur = a[k];
        if (typeof cur !== "object" || cur === null) {
          a2[k] = cur;
        } else if (cur.constructor !== Object && (handler = constructorHandlers.get(cur.constructor))) {
          a2[k] = handler(cur, fn);
        } else if (ArrayBuffer.isView(cur)) {
          a2[k] = copyBuffer(cur);
        } else {
          a2[k] = fn(cur);
        }
      }
      return a2;
    }
    function clone(o) {
      if (typeof o !== "object" || o === null)
        return o;
      if (Array.isArray(o))
        return cloneArray(o, clone);
      if (o.constructor !== Object && (handler = constructorHandlers.get(o.constructor))) {
        return handler(o, clone);
      }
      const o2 = {};
      for (const k in o) {
        if (Object.hasOwnProperty.call(o, k) === false)
          continue;
        const cur = o[k];
        if (typeof cur !== "object" || cur === null) {
          o2[k] = cur;
        } else if (cur.constructor !== Object && (handler = constructorHandlers.get(cur.constructor))) {
          o2[k] = handler(cur, clone);
        } else if (ArrayBuffer.isView(cur)) {
          o2[k] = copyBuffer(cur);
        } else {
          o2[k] = clone(cur);
        }
      }
      return o2;
    }
    function cloneProto(o) {
      if (typeof o !== "object" || o === null)
        return o;
      if (Array.isArray(o))
        return cloneArray(o, cloneProto);
      if (o.constructor !== Object && (handler = constructorHandlers.get(o.constructor))) {
        return handler(o, cloneProto);
      }
      const o2 = {};
      for (const k in o) {
        const cur = o[k];
        if (typeof cur !== "object" || cur === null) {
          o2[k] = cur;
        } else if (cur.constructor !== Object && (handler = constructorHandlers.get(cur.constructor))) {
          o2[k] = handler(cur, cloneProto);
        } else if (ArrayBuffer.isView(cur)) {
          o2[k] = copyBuffer(cur);
        } else {
          o2[k] = cloneProto(cur);
        }
      }
      return o2;
    }
  }
  function rfdcCircles(opts) {
    const refs = [];
    const refsNew = [];
    const constructorHandlers = new Map;
    constructorHandlers.set(Date, (o) => new Date(o));
    constructorHandlers.set(Map, (o, fn) => new Map(cloneArray(Array.from(o), fn)));
    constructorHandlers.set(Set, (o, fn) => new Set(cloneArray(Array.from(o), fn)));
    if (opts.constructorHandlers) {
      for (const handler2 of opts.constructorHandlers) {
        constructorHandlers.set(handler2[0], handler2[1]);
      }
    }
    let handler = null;
    return opts.proto ? cloneProto : clone;
    function cloneArray(a, fn) {
      const keys = Object.keys(a);
      const a2 = new Array(keys.length);
      for (let i = 0;i < keys.length; i++) {
        const k = keys[i];
        const cur = a[k];
        if (typeof cur !== "object" || cur === null) {
          a2[k] = cur;
        } else if (cur.constructor !== Object && (handler = constructorHandlers.get(cur.constructor))) {
          a2[k] = handler(cur, fn);
        } else if (ArrayBuffer.isView(cur)) {
          a2[k] = copyBuffer(cur);
        } else {
          const index = refs.indexOf(cur);
          if (index !== -1) {
            a2[k] = refsNew[index];
          } else {
            a2[k] = fn(cur);
          }
        }
      }
      return a2;
    }
    function clone(o) {
      if (typeof o !== "object" || o === null)
        return o;
      if (Array.isArray(o))
        return cloneArray(o, clone);
      if (o.constructor !== Object && (handler = constructorHandlers.get(o.constructor))) {
        return handler(o, clone);
      }
      const o2 = {};
      refs.push(o);
      refsNew.push(o2);
      for (const k in o) {
        if (Object.hasOwnProperty.call(o, k) === false)
          continue;
        const cur = o[k];
        if (typeof cur !== "object" || cur === null) {
          o2[k] = cur;
        } else if (cur.constructor !== Object && (handler = constructorHandlers.get(cur.constructor))) {
          o2[k] = handler(cur, clone);
        } else if (ArrayBuffer.isView(cur)) {
          o2[k] = copyBuffer(cur);
        } else {
          const i = refs.indexOf(cur);
          if (i !== -1) {
            o2[k] = refsNew[i];
          } else {
            o2[k] = clone(cur);
          }
        }
      }
      refs.pop();
      refsNew.pop();
      return o2;
    }
    function cloneProto(o) {
      if (typeof o !== "object" || o === null)
        return o;
      if (Array.isArray(o))
        return cloneArray(o, cloneProto);
      if (o.constructor !== Object && (handler = constructorHandlers.get(o.constructor))) {
        return handler(o, cloneProto);
      }
      const o2 = {};
      refs.push(o);
      refsNew.push(o2);
      for (const k in o) {
        const cur = o[k];
        if (typeof cur !== "object" || cur === null) {
          o2[k] = cur;
        } else if (cur.constructor !== Object && (handler = constructorHandlers.get(cur.constructor))) {
          o2[k] = handler(cur, cloneProto);
        } else if (ArrayBuffer.isView(cur)) {
          o2[k] = copyBuffer(cur);
        } else {
          const i = refs.indexOf(cur);
          if (i !== -1) {
            o2[k] = refsNew[i];
          } else {
            o2[k] = cloneProto(cur);
          }
        }
      }
      refs.pop();
      refsNew.pop();
      return o2;
    }
  }
});

// node_modules/.pnpm/fast-json-stringify@5.16.1/node_modules/fast-json-stringify/lib/validator.js
var require_validator = __commonJS((exports, module) => {
  var Ajv = require_ajv();
  var fastUri = require_fast_uri2();
  var ajvFormats = require_dist();
  var clone = require_rfdc()({ proto: true });

  class Validator {
    constructor(ajvOptions) {
      this.ajv = new Ajv({
        ...ajvOptions,
        strictSchema: false,
        validateSchema: false,
        allowUnionTypes: true,
        uriResolver: fastUri
      });
      ajvFormats(this.ajv);
      this.ajv.addKeyword({
        keyword: "fjs_type",
        type: "object",
        errors: false,
        validate: (type, date) => {
          return date instanceof Date;
        }
      });
      this._ajvSchemas = {};
      this._ajvOptions = ajvOptions || {};
    }
    addSchema(schema, schemaName) {
      let schemaKey = schema.$id || schemaName;
      if (schema.$id !== undefined && schema.$id[0] === "#") {
        schemaKey = schemaName + schema.$id;
      }
      if (this.ajv.refs[schemaKey] === undefined && this.ajv.schemas[schemaKey] === undefined) {
        const ajvSchema = clone(schema);
        this.convertSchemaToAjvFormat(ajvSchema);
        this.ajv.addSchema(ajvSchema, schemaKey);
        this._ajvSchemas[schemaKey] = schema;
      }
    }
    validate(schemaRef, data) {
      return this.ajv.validate(schemaRef, data);
    }
    convertSchemaToAjvFormat(schema) {
      if (schema === null)
        return;
      if (schema.type === "string") {
        schema.fjs_type = "string";
        schema.type = ["string", "object"];
      } else if (Array.isArray(schema.type) && schema.type.includes("string") && !schema.type.includes("object")) {
        schema.fjs_type = "string";
        schema.type.push("object");
      }
      for (const property in schema) {
        if (typeof schema[property] === "object") {
          this.convertSchemaToAjvFormat(schema[property]);
        }
      }
    }
    getState() {
      return {
        ajvOptions: this._ajvOptions,
        ajvSchemas: this._ajvSchemas
      };
    }
    static restoreFromState(state) {
      const validator = new Validator(state.ajvOptions);
      for (const [id, ajvSchema] of Object.entries(state.ajvSchemas)) {
        validator.ajv.addSchema(ajvSchema, id);
      }
      return validator;
    }
  }
  module.exports = Validator;
});

// node_modules/.pnpm/fast-json-stringify@5.16.1/node_modules/fast-json-stringify/lib/location.js
var require_location = __commonJS((exports, module) => {
  class Location {
    constructor(schema, schemaId, jsonPointer = "#") {
      this.schema = schema;
      this.schemaId = schemaId;
      this.jsonPointer = jsonPointer;
    }
    getPropertyLocation(propertyName) {
      const propertyLocation = new Location(this.schema[propertyName], this.schemaId, this.jsonPointer + "/" + propertyName);
      return propertyLocation;
    }
    getSchemaRef() {
      return this.schemaId + this.jsonPointer;
    }
  }
  module.exports = Location;
});

// node_modules/.pnpm/fast-json-stringify@5.16.1/node_modules/fast-json-stringify/lib/schema-validator.js
var require_schema_validator = __commonJS((exports, module) => {
  module.exports = validate10;
  module.exports.default = validate10;
  var schema11 = { $schema: "http://json-schema.org/draft-07/schema#", $id: "http://json-schema.org/draft-07/schema#", title: "Core schema meta-schema", definitions: { schemaArray: { type: "array", minItems: 1, items: { $ref: "#" } }, nonNegativeInteger: { type: "integer", minimum: 0 }, nonNegativeIntegerDefault0: { allOf: [{ $ref: "#/definitions/nonNegativeInteger" }, { default: 0 }] }, simpleTypes: { enum: ["array", "boolean", "integer", "null", "number", "object", "string"] }, stringArray: { type: "array", items: { type: "string" }, uniqueItems: true, default: [] } }, type: ["object", "boolean"], properties: { $id: { type: "string", format: "uri-reference" }, $schema: { type: "string", format: "uri" }, $ref: { type: "string", format: "uri-reference" }, $comment: { type: "string" }, title: { type: "string" }, description: { type: "string" }, default: true, readOnly: { type: "boolean", default: false }, examples: { type: "array", items: true }, multipleOf: { type: "number", exclusiveMinimum: 0 }, maximum: { type: "number" }, exclusiveMaximum: { type: "number" }, minimum: { type: "number" }, exclusiveMinimum: { type: "number" }, maxLength: { $ref: "#/definitions/nonNegativeInteger" }, minLength: { $ref: "#/definitions/nonNegativeIntegerDefault0" }, pattern: { type: "string", format: "regex" }, additionalItems: { $ref: "#" }, items: { anyOf: [{ $ref: "#" }, { $ref: "#/definitions/schemaArray" }], default: true }, maxItems: { $ref: "#/definitions/nonNegativeInteger" }, minItems: { $ref: "#/definitions/nonNegativeIntegerDefault0" }, uniqueItems: { type: "boolean", default: false }, contains: { $ref: "#" }, maxProperties: { $ref: "#/definitions/nonNegativeInteger" }, minProperties: { $ref: "#/definitions/nonNegativeIntegerDefault0" }, required: { $ref: "#/definitions/stringArray" }, additionalProperties: { $ref: "#" }, definitions: { type: "object", additionalProperties: { $ref: "#" }, default: {} }, properties: { type: "object", additionalProperties: { $ref: "#" }, default: {} }, patternProperties: { type: "object", additionalProperties: { $ref: "#" }, propertyNames: { format: "regex" }, default: {} }, dependencies: { type: "object", additionalProperties: { anyOf: [{ $ref: "#" }, { $ref: "#/definitions/stringArray" }] } }, propertyNames: { $ref: "#" }, const: true, enum: { type: "array", items: true, minItems: 1, uniqueItems: true }, type: { anyOf: [{ $ref: "#/definitions/simpleTypes" }, { type: "array", items: { $ref: "#/definitions/simpleTypes" }, minItems: 1, uniqueItems: true }] }, format: { type: "string" }, contentMediaType: { type: "string" }, contentEncoding: { type: "string" }, if: { $ref: "#" }, then: { $ref: "#" }, else: { $ref: "#" }, allOf: { $ref: "#/definitions/schemaArray" }, anyOf: { $ref: "#/definitions/schemaArray" }, oneOf: { $ref: "#/definitions/schemaArray" }, not: { $ref: "#" } }, default: true };
  var schema20 = { enum: ["array", "boolean", "integer", "null", "number", "object", "string"] };
  var formats0 = /^(?:[a-z][a-z0-9+\-.]*:)?(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'"()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?(?:\?(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i;
  var formats2 = require_formats().fullFormats.uri;
  var formats6 = require_formats().fullFormats.regex;
  function validate11(data, { instancePath = "", parentData, parentDataProperty, rootData = data } = {}) {
    let vErrors = null;
    let errors = 0;
    const _errs1 = errors;
    if (!(typeof data == "number" && (!(data % 1) && !isNaN(data)) && isFinite(data))) {
      validate11.errors = [{ instancePath, schemaPath: "#/definitions/nonNegativeInteger/type", keyword: "type", params: { type: "integer" }, message: "must be integer" }];
      return false;
    }
    if (errors === _errs1) {
      if (typeof data == "number" && isFinite(data)) {
        if (data < 0 || isNaN(data)) {
          validate11.errors = [{ instancePath, schemaPath: "#/definitions/nonNegativeInteger/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" }];
          return false;
        }
      }
    }
    validate11.errors = vErrors;
    return errors === 0;
  }
  var root1 = { validate: validate10 };
  function validate13(data, { instancePath = "", parentData, parentDataProperty, rootData = data } = {}) {
    let vErrors = null;
    let errors = 0;
    if (errors === 0) {
      if (Array.isArray(data)) {
        if (data.length < 1) {
          validate13.errors = [{ instancePath, schemaPath: "#/minItems", keyword: "minItems", params: { limit: 1 }, message: "must NOT have fewer than 1 items" }];
          return false;
        } else {
          var valid0 = true;
          const len0 = data.length;
          for (let i0 = 0;i0 < len0; i0++) {
            const _errs1 = errors;
            if (!root1.validate(data[i0], { instancePath: instancePath + "/" + i0, parentData: data, parentDataProperty: i0, rootData })) {
              vErrors = vErrors === null ? root1.validate.errors : vErrors.concat(root1.validate.errors);
              errors = vErrors.length;
            }
            var valid0 = _errs1 === errors;
            if (!valid0) {
              break;
            }
          }
        }
      } else {
        validate13.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
        return false;
      }
    }
    validate13.errors = vErrors;
    return errors === 0;
  }
  var func0 = require_equal().default;
  function validate10(data, { instancePath = "", parentData, parentDataProperty, rootData = data } = {}) {
    let vErrors = null;
    let errors = 0;
    if (!(data && typeof data == "object" && !Array.isArray(data)) && typeof data !== "boolean") {
      validate10.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: schema11.type }, message: "must be object,boolean" }];
      return false;
    }
    if (errors === 0) {
      if (data && typeof data == "object" && !Array.isArray(data)) {
        if (data.$id !== undefined) {
          let data0 = data.$id;
          const _errs1 = errors;
          if (errors === _errs1) {
            if (errors === _errs1) {
              if (typeof data0 === "string") {
                if (!formats0.test(data0)) {
                  validate10.errors = [{ instancePath: instancePath + "/$id", schemaPath: "#/properties/%24id/format", keyword: "format", params: { format: "uri-reference" }, message: 'must match format "' + "uri-reference" + '"' }];
                  return false;
                }
              } else {
                validate10.errors = [{ instancePath: instancePath + "/$id", schemaPath: "#/properties/%24id/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                return false;
              }
            }
          }
          var valid0 = _errs1 === errors;
        } else {
          var valid0 = true;
        }
        if (valid0) {
          if (data.$schema !== undefined) {
            let data1 = data.$schema;
            const _errs3 = errors;
            if (errors === _errs3) {
              if (errors === _errs3) {
                if (typeof data1 === "string") {
                  if (!formats2(data1)) {
                    validate10.errors = [{ instancePath: instancePath + "/$schema", schemaPath: "#/properties/%24schema/format", keyword: "format", params: { format: "uri" }, message: 'must match format "' + "uri" + '"' }];
                    return false;
                  }
                } else {
                  validate10.errors = [{ instancePath: instancePath + "/$schema", schemaPath: "#/properties/%24schema/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                  return false;
                }
              }
            }
            var valid0 = _errs3 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.$ref !== undefined) {
              let data2 = data.$ref;
              const _errs5 = errors;
              if (errors === _errs5) {
                if (errors === _errs5) {
                  if (typeof data2 === "string") {
                    if (!formats0.test(data2)) {
                      validate10.errors = [{ instancePath: instancePath + "/$ref", schemaPath: "#/properties/%24ref/format", keyword: "format", params: { format: "uri-reference" }, message: 'must match format "' + "uri-reference" + '"' }];
                      return false;
                    }
                  } else {
                    validate10.errors = [{ instancePath: instancePath + "/$ref", schemaPath: "#/properties/%24ref/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                    return false;
                  }
                }
              }
              var valid0 = _errs5 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.$comment !== undefined) {
                const _errs7 = errors;
                if (typeof data.$comment !== "string") {
                  validate10.errors = [{ instancePath: instancePath + "/$comment", schemaPath: "#/properties/%24comment/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                  return false;
                }
                var valid0 = _errs7 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.title !== undefined) {
                  const _errs9 = errors;
                  if (typeof data.title !== "string") {
                    validate10.errors = [{ instancePath: instancePath + "/title", schemaPath: "#/properties/title/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                    return false;
                  }
                  var valid0 = _errs9 === errors;
                } else {
                  var valid0 = true;
                }
                if (valid0) {
                  if (data.description !== undefined) {
                    const _errs11 = errors;
                    if (typeof data.description !== "string") {
                      validate10.errors = [{ instancePath: instancePath + "/description", schemaPath: "#/properties/description/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                      return false;
                    }
                    var valid0 = _errs11 === errors;
                  } else {
                    var valid0 = true;
                  }
                  if (valid0) {
                    if (data.readOnly !== undefined) {
                      const _errs13 = errors;
                      if (typeof data.readOnly !== "boolean") {
                        validate10.errors = [{ instancePath: instancePath + "/readOnly", schemaPath: "#/properties/readOnly/type", keyword: "type", params: { type: "boolean" }, message: "must be boolean" }];
                        return false;
                      }
                      var valid0 = _errs13 === errors;
                    } else {
                      var valid0 = true;
                    }
                    if (valid0) {
                      if (data.examples !== undefined) {
                        const _errs15 = errors;
                        if (errors === _errs15) {
                          if (!Array.isArray(data.examples)) {
                            validate10.errors = [{ instancePath: instancePath + "/examples", schemaPath: "#/properties/examples/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                            return false;
                          }
                        }
                        var valid0 = _errs15 === errors;
                      } else {
                        var valid0 = true;
                      }
                      if (valid0) {
                        if (data.multipleOf !== undefined) {
                          let data8 = data.multipleOf;
                          const _errs17 = errors;
                          if (errors === _errs17) {
                            if (typeof data8 == "number" && isFinite(data8)) {
                              if (data8 <= 0 || isNaN(data8)) {
                                validate10.errors = [{ instancePath: instancePath + "/multipleOf", schemaPath: "#/properties/multipleOf/exclusiveMinimum", keyword: "exclusiveMinimum", params: { comparison: ">", limit: 0 }, message: "must be > 0" }];
                                return false;
                              }
                            } else {
                              validate10.errors = [{ instancePath: instancePath + "/multipleOf", schemaPath: "#/properties/multipleOf/type", keyword: "type", params: { type: "number" }, message: "must be number" }];
                              return false;
                            }
                          }
                          var valid0 = _errs17 === errors;
                        } else {
                          var valid0 = true;
                        }
                        if (valid0) {
                          if (data.maximum !== undefined) {
                            let data9 = data.maximum;
                            const _errs19 = errors;
                            if (!(typeof data9 == "number" && isFinite(data9))) {
                              validate10.errors = [{ instancePath: instancePath + "/maximum", schemaPath: "#/properties/maximum/type", keyword: "type", params: { type: "number" }, message: "must be number" }];
                              return false;
                            }
                            var valid0 = _errs19 === errors;
                          } else {
                            var valid0 = true;
                          }
                          if (valid0) {
                            if (data.exclusiveMaximum !== undefined) {
                              let data10 = data.exclusiveMaximum;
                              const _errs21 = errors;
                              if (!(typeof data10 == "number" && isFinite(data10))) {
                                validate10.errors = [{ instancePath: instancePath + "/exclusiveMaximum", schemaPath: "#/properties/exclusiveMaximum/type", keyword: "type", params: { type: "number" }, message: "must be number" }];
                                return false;
                              }
                              var valid0 = _errs21 === errors;
                            } else {
                              var valid0 = true;
                            }
                            if (valid0) {
                              if (data.minimum !== undefined) {
                                let data11 = data.minimum;
                                const _errs23 = errors;
                                if (!(typeof data11 == "number" && isFinite(data11))) {
                                  validate10.errors = [{ instancePath: instancePath + "/minimum", schemaPath: "#/properties/minimum/type", keyword: "type", params: { type: "number" }, message: "must be number" }];
                                  return false;
                                }
                                var valid0 = _errs23 === errors;
                              } else {
                                var valid0 = true;
                              }
                              if (valid0) {
                                if (data.exclusiveMinimum !== undefined) {
                                  let data12 = data.exclusiveMinimum;
                                  const _errs25 = errors;
                                  if (!(typeof data12 == "number" && isFinite(data12))) {
                                    validate10.errors = [{ instancePath: instancePath + "/exclusiveMinimum", schemaPath: "#/properties/exclusiveMinimum/type", keyword: "type", params: { type: "number" }, message: "must be number" }];
                                    return false;
                                  }
                                  var valid0 = _errs25 === errors;
                                } else {
                                  var valid0 = true;
                                }
                                if (valid0) {
                                  if (data.maxLength !== undefined) {
                                    let data13 = data.maxLength;
                                    const _errs27 = errors;
                                    const _errs28 = errors;
                                    if (!(typeof data13 == "number" && (!(data13 % 1) && !isNaN(data13)) && isFinite(data13))) {
                                      validate10.errors = [{ instancePath: instancePath + "/maxLength", schemaPath: "#/definitions/nonNegativeInteger/type", keyword: "type", params: { type: "integer" }, message: "must be integer" }];
                                      return false;
                                    }
                                    if (errors === _errs28) {
                                      if (typeof data13 == "number" && isFinite(data13)) {
                                        if (data13 < 0 || isNaN(data13)) {
                                          validate10.errors = [{ instancePath: instancePath + "/maxLength", schemaPath: "#/definitions/nonNegativeInteger/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" }];
                                          return false;
                                        }
                                      }
                                    }
                                    var valid0 = _errs27 === errors;
                                  } else {
                                    var valid0 = true;
                                  }
                                  if (valid0) {
                                    if (data.minLength !== undefined) {
                                      const _errs30 = errors;
                                      if (!validate11(data.minLength, { instancePath: instancePath + "/minLength", parentData: data, parentDataProperty: "minLength", rootData })) {
                                        vErrors = vErrors === null ? validate11.errors : vErrors.concat(validate11.errors);
                                        errors = vErrors.length;
                                      }
                                      var valid0 = _errs30 === errors;
                                    } else {
                                      var valid0 = true;
                                    }
                                    if (valid0) {
                                      if (data.pattern !== undefined) {
                                        let data15 = data.pattern;
                                        const _errs31 = errors;
                                        if (errors === _errs31) {
                                          if (errors === _errs31) {
                                            if (typeof data15 === "string") {
                                              if (!formats6(data15)) {
                                                validate10.errors = [{ instancePath: instancePath + "/pattern", schemaPath: "#/properties/pattern/format", keyword: "format", params: { format: "regex" }, message: 'must match format "' + "regex" + '"' }];
                                                return false;
                                              }
                                            } else {
                                              validate10.errors = [{ instancePath: instancePath + "/pattern", schemaPath: "#/properties/pattern/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                                              return false;
                                            }
                                          }
                                        }
                                        var valid0 = _errs31 === errors;
                                      } else {
                                        var valid0 = true;
                                      }
                                      if (valid0) {
                                        if (data.additionalItems !== undefined) {
                                          const _errs33 = errors;
                                          if (!validate10(data.additionalItems, { instancePath: instancePath + "/additionalItems", parentData: data, parentDataProperty: "additionalItems", rootData })) {
                                            vErrors = vErrors === null ? validate10.errors : vErrors.concat(validate10.errors);
                                            errors = vErrors.length;
                                          }
                                          var valid0 = _errs33 === errors;
                                        } else {
                                          var valid0 = true;
                                        }
                                        if (valid0) {
                                          if (data.items !== undefined) {
                                            let data17 = data.items;
                                            const _errs34 = errors;
                                            const _errs35 = errors;
                                            let valid2 = false;
                                            const _errs36 = errors;
                                            if (!validate10(data17, { instancePath: instancePath + "/items", parentData: data, parentDataProperty: "items", rootData })) {
                                              vErrors = vErrors === null ? validate10.errors : vErrors.concat(validate10.errors);
                                              errors = vErrors.length;
                                            }
                                            var _valid0 = _errs36 === errors;
                                            valid2 = valid2 || _valid0;
                                            if (!valid2) {
                                              const _errs37 = errors;
                                              if (!validate13(data17, { instancePath: instancePath + "/items", parentData: data, parentDataProperty: "items", rootData })) {
                                                vErrors = vErrors === null ? validate13.errors : vErrors.concat(validate13.errors);
                                                errors = vErrors.length;
                                              }
                                              var _valid0 = _errs37 === errors;
                                              valid2 = valid2 || _valid0;
                                            }
                                            if (!valid2) {
                                              const err0 = { instancePath: instancePath + "/items", schemaPath: "#/properties/items/anyOf", keyword: "anyOf", params: {}, message: "must match a schema in anyOf" };
                                              if (vErrors === null) {
                                                vErrors = [err0];
                                              } else {
                                                vErrors.push(err0);
                                              }
                                              errors++;
                                              validate10.errors = vErrors;
                                              return false;
                                            } else {
                                              errors = _errs35;
                                              if (vErrors !== null) {
                                                if (_errs35) {
                                                  vErrors.length = _errs35;
                                                } else {
                                                  vErrors = null;
                                                }
                                              }
                                            }
                                            var valid0 = _errs34 === errors;
                                          } else {
                                            var valid0 = true;
                                          }
                                          if (valid0) {
                                            if (data.maxItems !== undefined) {
                                              let data18 = data.maxItems;
                                              const _errs38 = errors;
                                              const _errs39 = errors;
                                              if (!(typeof data18 == "number" && (!(data18 % 1) && !isNaN(data18)) && isFinite(data18))) {
                                                validate10.errors = [{ instancePath: instancePath + "/maxItems", schemaPath: "#/definitions/nonNegativeInteger/type", keyword: "type", params: { type: "integer" }, message: "must be integer" }];
                                                return false;
                                              }
                                              if (errors === _errs39) {
                                                if (typeof data18 == "number" && isFinite(data18)) {
                                                  if (data18 < 0 || isNaN(data18)) {
                                                    validate10.errors = [{ instancePath: instancePath + "/maxItems", schemaPath: "#/definitions/nonNegativeInteger/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" }];
                                                    return false;
                                                  }
                                                }
                                              }
                                              var valid0 = _errs38 === errors;
                                            } else {
                                              var valid0 = true;
                                            }
                                            if (valid0) {
                                              if (data.minItems !== undefined) {
                                                const _errs41 = errors;
                                                if (!validate11(data.minItems, { instancePath: instancePath + "/minItems", parentData: data, parentDataProperty: "minItems", rootData })) {
                                                  vErrors = vErrors === null ? validate11.errors : vErrors.concat(validate11.errors);
                                                  errors = vErrors.length;
                                                }
                                                var valid0 = _errs41 === errors;
                                              } else {
                                                var valid0 = true;
                                              }
                                              if (valid0) {
                                                if (data.uniqueItems !== undefined) {
                                                  const _errs42 = errors;
                                                  if (typeof data.uniqueItems !== "boolean") {
                                                    validate10.errors = [{ instancePath: instancePath + "/uniqueItems", schemaPath: "#/properties/uniqueItems/type", keyword: "type", params: { type: "boolean" }, message: "must be boolean" }];
                                                    return false;
                                                  }
                                                  var valid0 = _errs42 === errors;
                                                } else {
                                                  var valid0 = true;
                                                }
                                                if (valid0) {
                                                  if (data.contains !== undefined) {
                                                    const _errs44 = errors;
                                                    if (!validate10(data.contains, { instancePath: instancePath + "/contains", parentData: data, parentDataProperty: "contains", rootData })) {
                                                      vErrors = vErrors === null ? validate10.errors : vErrors.concat(validate10.errors);
                                                      errors = vErrors.length;
                                                    }
                                                    var valid0 = _errs44 === errors;
                                                  } else {
                                                    var valid0 = true;
                                                  }
                                                  if (valid0) {
                                                    if (data.maxProperties !== undefined) {
                                                      let data22 = data.maxProperties;
                                                      const _errs45 = errors;
                                                      const _errs46 = errors;
                                                      if (!(typeof data22 == "number" && (!(data22 % 1) && !isNaN(data22)) && isFinite(data22))) {
                                                        validate10.errors = [{ instancePath: instancePath + "/maxProperties", schemaPath: "#/definitions/nonNegativeInteger/type", keyword: "type", params: { type: "integer" }, message: "must be integer" }];
                                                        return false;
                                                      }
                                                      if (errors === _errs46) {
                                                        if (typeof data22 == "number" && isFinite(data22)) {
                                                          if (data22 < 0 || isNaN(data22)) {
                                                            validate10.errors = [{ instancePath: instancePath + "/maxProperties", schemaPath: "#/definitions/nonNegativeInteger/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" }];
                                                            return false;
                                                          }
                                                        }
                                                      }
                                                      var valid0 = _errs45 === errors;
                                                    } else {
                                                      var valid0 = true;
                                                    }
                                                    if (valid0) {
                                                      if (data.minProperties !== undefined) {
                                                        const _errs48 = errors;
                                                        if (!validate11(data.minProperties, { instancePath: instancePath + "/minProperties", parentData: data, parentDataProperty: "minProperties", rootData })) {
                                                          vErrors = vErrors === null ? validate11.errors : vErrors.concat(validate11.errors);
                                                          errors = vErrors.length;
                                                        }
                                                        var valid0 = _errs48 === errors;
                                                      } else {
                                                        var valid0 = true;
                                                      }
                                                      if (valid0) {
                                                        if (data.required !== undefined) {
                                                          let data24 = data.required;
                                                          const _errs49 = errors;
                                                          const _errs50 = errors;
                                                          if (errors === _errs50) {
                                                            if (Array.isArray(data24)) {
                                                              var valid6 = true;
                                                              const len0 = data24.length;
                                                              for (let i0 = 0;i0 < len0; i0++) {
                                                                const _errs52 = errors;
                                                                if (typeof data24[i0] !== "string") {
                                                                  validate10.errors = [{ instancePath: instancePath + "/required/" + i0, schemaPath: "#/definitions/stringArray/items/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                                                                  return false;
                                                                }
                                                                var valid6 = _errs52 === errors;
                                                                if (!valid6) {
                                                                  break;
                                                                }
                                                              }
                                                              if (valid6) {
                                                                let i1 = data24.length;
                                                                let j0;
                                                                if (i1 > 1) {
                                                                  const indices0 = {};
                                                                  for (;i1--; ) {
                                                                    let item0 = data24[i1];
                                                                    if (typeof item0 !== "string") {
                                                                      continue;
                                                                    }
                                                                    if (typeof indices0[item0] == "number") {
                                                                      j0 = indices0[item0];
                                                                      validate10.errors = [{ instancePath: instancePath + "/required", schemaPath: "#/definitions/stringArray/uniqueItems", keyword: "uniqueItems", params: { i: i1, j: j0 }, message: "must NOT have duplicate items (items ## " + j0 + " and " + i1 + " are identical)" }];
                                                                      return false;
                                                                      break;
                                                                    }
                                                                    indices0[item0] = i1;
                                                                  }
                                                                }
                                                              }
                                                            } else {
                                                              validate10.errors = [{ instancePath: instancePath + "/required", schemaPath: "#/definitions/stringArray/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                                                              return false;
                                                            }
                                                          }
                                                          var valid0 = _errs49 === errors;
                                                        } else {
                                                          var valid0 = true;
                                                        }
                                                        if (valid0) {
                                                          if (data.additionalProperties !== undefined) {
                                                            const _errs54 = errors;
                                                            if (!validate10(data.additionalProperties, { instancePath: instancePath + "/additionalProperties", parentData: data, parentDataProperty: "additionalProperties", rootData })) {
                                                              vErrors = vErrors === null ? validate10.errors : vErrors.concat(validate10.errors);
                                                              errors = vErrors.length;
                                                            }
                                                            var valid0 = _errs54 === errors;
                                                          } else {
                                                            var valid0 = true;
                                                          }
                                                          if (valid0) {
                                                            if (data.definitions !== undefined) {
                                                              let data27 = data.definitions;
                                                              const _errs55 = errors;
                                                              if (errors === _errs55) {
                                                                if (data27 && typeof data27 == "object" && !Array.isArray(data27)) {
                                                                  for (const key0 in data27) {
                                                                    const _errs58 = errors;
                                                                    if (!validate10(data27[key0], { instancePath: instancePath + "/definitions/" + key0.replace(/~/g, "~0").replace(/\//g, "~1"), parentData: data27, parentDataProperty: key0, rootData })) {
                                                                      vErrors = vErrors === null ? validate10.errors : vErrors.concat(validate10.errors);
                                                                      errors = vErrors.length;
                                                                    }
                                                                    var valid8 = _errs58 === errors;
                                                                    if (!valid8) {
                                                                      break;
                                                                    }
                                                                  }
                                                                } else {
                                                                  validate10.errors = [{ instancePath: instancePath + "/definitions", schemaPath: "#/properties/definitions/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
                                                                  return false;
                                                                }
                                                              }
                                                              var valid0 = _errs55 === errors;
                                                            } else {
                                                              var valid0 = true;
                                                            }
                                                            if (valid0) {
                                                              if (data.properties !== undefined) {
                                                                let data29 = data.properties;
                                                                const _errs59 = errors;
                                                                if (errors === _errs59) {
                                                                  if (data29 && typeof data29 == "object" && !Array.isArray(data29)) {
                                                                    for (const key1 in data29) {
                                                                      const _errs62 = errors;
                                                                      if (!validate10(data29[key1], { instancePath: instancePath + "/properties/" + key1.replace(/~/g, "~0").replace(/\//g, "~1"), parentData: data29, parentDataProperty: key1, rootData })) {
                                                                        vErrors = vErrors === null ? validate10.errors : vErrors.concat(validate10.errors);
                                                                        errors = vErrors.length;
                                                                      }
                                                                      var valid9 = _errs62 === errors;
                                                                      if (!valid9) {
                                                                        break;
                                                                      }
                                                                    }
                                                                  } else {
                                                                    validate10.errors = [{ instancePath: instancePath + "/properties", schemaPath: "#/properties/properties/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
                                                                    return false;
                                                                  }
                                                                }
                                                                var valid0 = _errs59 === errors;
                                                              } else {
                                                                var valid0 = true;
                                                              }
                                                              if (valid0) {
                                                                if (data.patternProperties !== undefined) {
                                                                  let data31 = data.patternProperties;
                                                                  const _errs63 = errors;
                                                                  if (errors === _errs63) {
                                                                    if (data31 && typeof data31 == "object" && !Array.isArray(data31)) {
                                                                      for (const key2 in data31) {
                                                                        const _errs65 = errors;
                                                                        if (errors === _errs65) {
                                                                          if (typeof key2 === "string") {
                                                                            if (!formats6(key2)) {
                                                                              const err1 = { instancePath: instancePath + "/patternProperties", schemaPath: "#/properties/patternProperties/propertyNames/format", keyword: "format", params: { format: "regex" }, message: 'must match format "' + "regex" + '"', propertyName: key2 };
                                                                              if (vErrors === null) {
                                                                                vErrors = [err1];
                                                                              } else {
                                                                                vErrors.push(err1);
                                                                              }
                                                                              errors++;
                                                                            }
                                                                          }
                                                                        }
                                                                        var valid10 = _errs65 === errors;
                                                                        if (!valid10) {
                                                                          const err2 = { instancePath: instancePath + "/patternProperties", schemaPath: "#/properties/patternProperties/propertyNames", keyword: "propertyNames", params: { propertyName: key2 }, message: "property name must be valid" };
                                                                          if (vErrors === null) {
                                                                            vErrors = [err2];
                                                                          } else {
                                                                            vErrors.push(err2);
                                                                          }
                                                                          errors++;
                                                                          validate10.errors = vErrors;
                                                                          return false;
                                                                          break;
                                                                        }
                                                                      }
                                                                      if (valid10) {
                                                                        for (const key3 in data31) {
                                                                          const _errs67 = errors;
                                                                          if (!validate10(data31[key3], { instancePath: instancePath + "/patternProperties/" + key3.replace(/~/g, "~0").replace(/\//g, "~1"), parentData: data31, parentDataProperty: key3, rootData })) {
                                                                            vErrors = vErrors === null ? validate10.errors : vErrors.concat(validate10.errors);
                                                                            errors = vErrors.length;
                                                                          }
                                                                          var valid11 = _errs67 === errors;
                                                                          if (!valid11) {
                                                                            break;
                                                                          }
                                                                        }
                                                                      }
                                                                    } else {
                                                                      validate10.errors = [{ instancePath: instancePath + "/patternProperties", schemaPath: "#/properties/patternProperties/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
                                                                      return false;
                                                                    }
                                                                  }
                                                                  var valid0 = _errs63 === errors;
                                                                } else {
                                                                  var valid0 = true;
                                                                }
                                                                if (valid0) {
                                                                  if (data.dependencies !== undefined) {
                                                                    let data33 = data.dependencies;
                                                                    const _errs68 = errors;
                                                                    if (errors === _errs68) {
                                                                      if (data33 && typeof data33 == "object" && !Array.isArray(data33)) {
                                                                        for (const key4 in data33) {
                                                                          let data34 = data33[key4];
                                                                          const _errs71 = errors;
                                                                          const _errs72 = errors;
                                                                          let valid13 = false;
                                                                          const _errs73 = errors;
                                                                          if (!validate10(data34, { instancePath: instancePath + "/dependencies/" + key4.replace(/~/g, "~0").replace(/\//g, "~1"), parentData: data33, parentDataProperty: key4, rootData })) {
                                                                            vErrors = vErrors === null ? validate10.errors : vErrors.concat(validate10.errors);
                                                                            errors = vErrors.length;
                                                                          }
                                                                          var _valid1 = _errs73 === errors;
                                                                          valid13 = valid13 || _valid1;
                                                                          if (!valid13) {
                                                                            const _errs74 = errors;
                                                                            const _errs75 = errors;
                                                                            if (errors === _errs75) {
                                                                              if (Array.isArray(data34)) {
                                                                                var valid15 = true;
                                                                                const len1 = data34.length;
                                                                                for (let i2 = 0;i2 < len1; i2++) {
                                                                                  const _errs77 = errors;
                                                                                  if (typeof data34[i2] !== "string") {
                                                                                    const err3 = { instancePath: instancePath + "/dependencies/" + key4.replace(/~/g, "~0").replace(/\//g, "~1") + "/" + i2, schemaPath: "#/definitions/stringArray/items/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                                                                                    if (vErrors === null) {
                                                                                      vErrors = [err3];
                                                                                    } else {
                                                                                      vErrors.push(err3);
                                                                                    }
                                                                                    errors++;
                                                                                  }
                                                                                  var valid15 = _errs77 === errors;
                                                                                  if (!valid15) {
                                                                                    break;
                                                                                  }
                                                                                }
                                                                                if (valid15) {
                                                                                  let i3 = data34.length;
                                                                                  let j1;
                                                                                  if (i3 > 1) {
                                                                                    const indices1 = {};
                                                                                    for (;i3--; ) {
                                                                                      let item1 = data34[i3];
                                                                                      if (typeof item1 !== "string") {
                                                                                        continue;
                                                                                      }
                                                                                      if (typeof indices1[item1] == "number") {
                                                                                        j1 = indices1[item1];
                                                                                        const err4 = { instancePath: instancePath + "/dependencies/" + key4.replace(/~/g, "~0").replace(/\//g, "~1"), schemaPath: "#/definitions/stringArray/uniqueItems", keyword: "uniqueItems", params: { i: i3, j: j1 }, message: "must NOT have duplicate items (items ## " + j1 + " and " + i3 + " are identical)" };
                                                                                        if (vErrors === null) {
                                                                                          vErrors = [err4];
                                                                                        } else {
                                                                                          vErrors.push(err4);
                                                                                        }
                                                                                        errors++;
                                                                                        break;
                                                                                      }
                                                                                      indices1[item1] = i3;
                                                                                    }
                                                                                  }
                                                                                }
                                                                              } else {
                                                                                const err5 = { instancePath: instancePath + "/dependencies/" + key4.replace(/~/g, "~0").replace(/\//g, "~1"), schemaPath: "#/definitions/stringArray/type", keyword: "type", params: { type: "array" }, message: "must be array" };
                                                                                if (vErrors === null) {
                                                                                  vErrors = [err5];
                                                                                } else {
                                                                                  vErrors.push(err5);
                                                                                }
                                                                                errors++;
                                                                              }
                                                                            }
                                                                            var _valid1 = _errs74 === errors;
                                                                            valid13 = valid13 || _valid1;
                                                                          }
                                                                          if (!valid13) {
                                                                            const err6 = { instancePath: instancePath + "/dependencies/" + key4.replace(/~/g, "~0").replace(/\//g, "~1"), schemaPath: "#/properties/dependencies/additionalProperties/anyOf", keyword: "anyOf", params: {}, message: "must match a schema in anyOf" };
                                                                            if (vErrors === null) {
                                                                              vErrors = [err6];
                                                                            } else {
                                                                              vErrors.push(err6);
                                                                            }
                                                                            errors++;
                                                                            validate10.errors = vErrors;
                                                                            return false;
                                                                          } else {
                                                                            errors = _errs72;
                                                                            if (vErrors !== null) {
                                                                              if (_errs72) {
                                                                                vErrors.length = _errs72;
                                                                              } else {
                                                                                vErrors = null;
                                                                              }
                                                                            }
                                                                          }
                                                                          var valid12 = _errs71 === errors;
                                                                          if (!valid12) {
                                                                            break;
                                                                          }
                                                                        }
                                                                      } else {
                                                                        validate10.errors = [{ instancePath: instancePath + "/dependencies", schemaPath: "#/properties/dependencies/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
                                                                        return false;
                                                                      }
                                                                    }
                                                                    var valid0 = _errs68 === errors;
                                                                  } else {
                                                                    var valid0 = true;
                                                                  }
                                                                  if (valid0) {
                                                                    if (data.propertyNames !== undefined) {
                                                                      const _errs79 = errors;
                                                                      if (!validate10(data.propertyNames, { instancePath: instancePath + "/propertyNames", parentData: data, parentDataProperty: "propertyNames", rootData })) {
                                                                        vErrors = vErrors === null ? validate10.errors : vErrors.concat(validate10.errors);
                                                                        errors = vErrors.length;
                                                                      }
                                                                      var valid0 = _errs79 === errors;
                                                                    } else {
                                                                      var valid0 = true;
                                                                    }
                                                                    if (valid0) {
                                                                      if (data.enum !== undefined) {
                                                                        let data37 = data.enum;
                                                                        const _errs80 = errors;
                                                                        if (errors === _errs80) {
                                                                          if (Array.isArray(data37)) {
                                                                            if (data37.length < 1) {
                                                                              validate10.errors = [{ instancePath: instancePath + "/enum", schemaPath: "#/properties/enum/minItems", keyword: "minItems", params: { limit: 1 }, message: "must NOT have fewer than 1 items" }];
                                                                              return false;
                                                                            } else {
                                                                              let i4 = data37.length;
                                                                              let j2;
                                                                              if (i4 > 1) {
                                                                                outer0:
                                                                                  for (;i4--; ) {
                                                                                    for (j2 = i4;j2--; ) {
                                                                                      if (func0(data37[i4], data37[j2])) {
                                                                                        validate10.errors = [{ instancePath: instancePath + "/enum", schemaPath: "#/properties/enum/uniqueItems", keyword: "uniqueItems", params: { i: i4, j: j2 }, message: "must NOT have duplicate items (items ## " + j2 + " and " + i4 + " are identical)" }];
                                                                                        return false;
                                                                                        break outer0;
                                                                                      }
                                                                                    }
                                                                                  }
                                                                              }
                                                                            }
                                                                          } else {
                                                                            validate10.errors = [{ instancePath: instancePath + "/enum", schemaPath: "#/properties/enum/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                                                                            return false;
                                                                          }
                                                                        }
                                                                        var valid0 = _errs80 === errors;
                                                                      } else {
                                                                        var valid0 = true;
                                                                      }
                                                                      if (valid0) {
                                                                        if (data.type !== undefined) {
                                                                          let data38 = data.type;
                                                                          const _errs82 = errors;
                                                                          const _errs83 = errors;
                                                                          let valid18 = false;
                                                                          const _errs84 = errors;
                                                                          if (!(data38 === "array" || data38 === "boolean" || data38 === "integer" || data38 === "null" || data38 === "number" || data38 === "object" || data38 === "string")) {
                                                                            const err7 = { instancePath: instancePath + "/type", schemaPath: "#/definitions/simpleTypes/enum", keyword: "enum", params: { allowedValues: schema20.enum }, message: "must be equal to one of the allowed values" };
                                                                            if (vErrors === null) {
                                                                              vErrors = [err7];
                                                                            } else {
                                                                              vErrors.push(err7);
                                                                            }
                                                                            errors++;
                                                                          }
                                                                          var _valid2 = _errs84 === errors;
                                                                          valid18 = valid18 || _valid2;
                                                                          if (!valid18) {
                                                                            const _errs86 = errors;
                                                                            if (errors === _errs86) {
                                                                              if (Array.isArray(data38)) {
                                                                                if (data38.length < 1) {
                                                                                  const err8 = { instancePath: instancePath + "/type", schemaPath: "#/properties/type/anyOf/1/minItems", keyword: "minItems", params: { limit: 1 }, message: "must NOT have fewer than 1 items" };
                                                                                  if (vErrors === null) {
                                                                                    vErrors = [err8];
                                                                                  } else {
                                                                                    vErrors.push(err8);
                                                                                  }
                                                                                  errors++;
                                                                                } else {
                                                                                  var valid20 = true;
                                                                                  const len2 = data38.length;
                                                                                  for (let i5 = 0;i5 < len2; i5++) {
                                                                                    let data39 = data38[i5];
                                                                                    const _errs88 = errors;
                                                                                    if (!(data39 === "array" || data39 === "boolean" || data39 === "integer" || data39 === "null" || data39 === "number" || data39 === "object" || data39 === "string")) {
                                                                                      const err9 = { instancePath: instancePath + "/type/" + i5, schemaPath: "#/definitions/simpleTypes/enum", keyword: "enum", params: { allowedValues: schema20.enum }, message: "must be equal to one of the allowed values" };
                                                                                      if (vErrors === null) {
                                                                                        vErrors = [err9];
                                                                                      } else {
                                                                                        vErrors.push(err9);
                                                                                      }
                                                                                      errors++;
                                                                                    }
                                                                                    var valid20 = _errs88 === errors;
                                                                                    if (!valid20) {
                                                                                      break;
                                                                                    }
                                                                                  }
                                                                                  if (valid20) {
                                                                                    let i6 = data38.length;
                                                                                    let j3;
                                                                                    if (i6 > 1) {
                                                                                      outer1:
                                                                                        for (;i6--; ) {
                                                                                          for (j3 = i6;j3--; ) {
                                                                                            if (func0(data38[i6], data38[j3])) {
                                                                                              const err10 = { instancePath: instancePath + "/type", schemaPath: "#/properties/type/anyOf/1/uniqueItems", keyword: "uniqueItems", params: { i: i6, j: j3 }, message: "must NOT have duplicate items (items ## " + j3 + " and " + i6 + " are identical)" };
                                                                                              if (vErrors === null) {
                                                                                                vErrors = [err10];
                                                                                              } else {
                                                                                                vErrors.push(err10);
                                                                                              }
                                                                                              errors++;
                                                                                              break outer1;
                                                                                            }
                                                                                          }
                                                                                        }
                                                                                    }
                                                                                  }
                                                                                }
                                                                              } else {
                                                                                const err11 = { instancePath: instancePath + "/type", schemaPath: "#/properties/type/anyOf/1/type", keyword: "type", params: { type: "array" }, message: "must be array" };
                                                                                if (vErrors === null) {
                                                                                  vErrors = [err11];
                                                                                } else {
                                                                                  vErrors.push(err11);
                                                                                }
                                                                                errors++;
                                                                              }
                                                                            }
                                                                            var _valid2 = _errs86 === errors;
                                                                            valid18 = valid18 || _valid2;
                                                                          }
                                                                          if (!valid18) {
                                                                            const err12 = { instancePath: instancePath + "/type", schemaPath: "#/properties/type/anyOf", keyword: "anyOf", params: {}, message: "must match a schema in anyOf" };
                                                                            if (vErrors === null) {
                                                                              vErrors = [err12];
                                                                            } else {
                                                                              vErrors.push(err12);
                                                                            }
                                                                            errors++;
                                                                            validate10.errors = vErrors;
                                                                            return false;
                                                                          } else {
                                                                            errors = _errs83;
                                                                            if (vErrors !== null) {
                                                                              if (_errs83) {
                                                                                vErrors.length = _errs83;
                                                                              } else {
                                                                                vErrors = null;
                                                                              }
                                                                            }
                                                                          }
                                                                          var valid0 = _errs82 === errors;
                                                                        } else {
                                                                          var valid0 = true;
                                                                        }
                                                                        if (valid0) {
                                                                          if (data.format !== undefined) {
                                                                            const _errs90 = errors;
                                                                            if (typeof data.format !== "string") {
                                                                              validate10.errors = [{ instancePath: instancePath + "/format", schemaPath: "#/properties/format/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                                                                              return false;
                                                                            }
                                                                            var valid0 = _errs90 === errors;
                                                                          } else {
                                                                            var valid0 = true;
                                                                          }
                                                                          if (valid0) {
                                                                            if (data.contentMediaType !== undefined) {
                                                                              const _errs92 = errors;
                                                                              if (typeof data.contentMediaType !== "string") {
                                                                                validate10.errors = [{ instancePath: instancePath + "/contentMediaType", schemaPath: "#/properties/contentMediaType/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                                                                                return false;
                                                                              }
                                                                              var valid0 = _errs92 === errors;
                                                                            } else {
                                                                              var valid0 = true;
                                                                            }
                                                                            if (valid0) {
                                                                              if (data.contentEncoding !== undefined) {
                                                                                const _errs94 = errors;
                                                                                if (typeof data.contentEncoding !== "string") {
                                                                                  validate10.errors = [{ instancePath: instancePath + "/contentEncoding", schemaPath: "#/properties/contentEncoding/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                                                                                  return false;
                                                                                }
                                                                                var valid0 = _errs94 === errors;
                                                                              } else {
                                                                                var valid0 = true;
                                                                              }
                                                                              if (valid0) {
                                                                                if (data.if !== undefined) {
                                                                                  const _errs96 = errors;
                                                                                  if (!validate10(data.if, { instancePath: instancePath + "/if", parentData: data, parentDataProperty: "if", rootData })) {
                                                                                    vErrors = vErrors === null ? validate10.errors : vErrors.concat(validate10.errors);
                                                                                    errors = vErrors.length;
                                                                                  }
                                                                                  var valid0 = _errs96 === errors;
                                                                                } else {
                                                                                  var valid0 = true;
                                                                                }
                                                                                if (valid0) {
                                                                                  if (data.then !== undefined) {
                                                                                    const _errs97 = errors;
                                                                                    if (!validate10(data.then, { instancePath: instancePath + "/then", parentData: data, parentDataProperty: "then", rootData })) {
                                                                                      vErrors = vErrors === null ? validate10.errors : vErrors.concat(validate10.errors);
                                                                                      errors = vErrors.length;
                                                                                    }
                                                                                    var valid0 = _errs97 === errors;
                                                                                  } else {
                                                                                    var valid0 = true;
                                                                                  }
                                                                                  if (valid0) {
                                                                                    if (data.else !== undefined) {
                                                                                      const _errs98 = errors;
                                                                                      if (!validate10(data.else, { instancePath: instancePath + "/else", parentData: data, parentDataProperty: "else", rootData })) {
                                                                                        vErrors = vErrors === null ? validate10.errors : vErrors.concat(validate10.errors);
                                                                                        errors = vErrors.length;
                                                                                      }
                                                                                      var valid0 = _errs98 === errors;
                                                                                    } else {
                                                                                      var valid0 = true;
                                                                                    }
                                                                                    if (valid0) {
                                                                                      if (data.allOf !== undefined) {
                                                                                        const _errs99 = errors;
                                                                                        if (!validate13(data.allOf, { instancePath: instancePath + "/allOf", parentData: data, parentDataProperty: "allOf", rootData })) {
                                                                                          vErrors = vErrors === null ? validate13.errors : vErrors.concat(validate13.errors);
                                                                                          errors = vErrors.length;
                                                                                        }
                                                                                        var valid0 = _errs99 === errors;
                                                                                      } else {
                                                                                        var valid0 = true;
                                                                                      }
                                                                                      if (valid0) {
                                                                                        if (data.anyOf !== undefined) {
                                                                                          const _errs100 = errors;
                                                                                          if (!validate13(data.anyOf, { instancePath: instancePath + "/anyOf", parentData: data, parentDataProperty: "anyOf", rootData })) {
                                                                                            vErrors = vErrors === null ? validate13.errors : vErrors.concat(validate13.errors);
                                                                                            errors = vErrors.length;
                                                                                          }
                                                                                          var valid0 = _errs100 === errors;
                                                                                        } else {
                                                                                          var valid0 = true;
                                                                                        }
                                                                                        if (valid0) {
                                                                                          if (data.oneOf !== undefined) {
                                                                                            const _errs101 = errors;
                                                                                            if (!validate13(data.oneOf, { instancePath: instancePath + "/oneOf", parentData: data, parentDataProperty: "oneOf", rootData })) {
                                                                                              vErrors = vErrors === null ? validate13.errors : vErrors.concat(validate13.errors);
                                                                                              errors = vErrors.length;
                                                                                            }
                                                                                            var valid0 = _errs101 === errors;
                                                                                          } else {
                                                                                            var valid0 = true;
                                                                                          }
                                                                                          if (valid0) {
                                                                                            if (data.not !== undefined) {
                                                                                              const _errs102 = errors;
                                                                                              if (!validate10(data.not, { instancePath: instancePath + "/not", parentData: data, parentDataProperty: "not", rootData })) {
                                                                                                vErrors = vErrors === null ? validate10.errors : vErrors.concat(validate10.errors);
                                                                                                errors = vErrors.length;
                                                                                              }
                                                                                              var valid0 = _errs102 === errors;
                                                                                            } else {
                                                                                              var valid0 = true;
                                                                                            }
                                                                                          }
                                                                                        }
                                                                                      }
                                                                                    }
                                                                                  }
                                                                                }
                                                                              }
                                                                            }
                                                                          }
                                                                        }
                                                                      }
                                                                    }
                                                                  }
                                                                }
                                                              }
                                                            }
                                                          }
                                                        }
                                                      }
                                                    }
                                                  }
                                                }
                                              }
                                            }
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    validate10.errors = vErrors;
    return errors === 0;
  }
});

// node_modules/.pnpm/@fastify+merge-json-schemas@0.1.1/node_modules/@fastify/merge-json-schemas/lib/errors.js
var require_errors2 = __commonJS((exports, module) => {
  class MergeError extends Error {
    constructor(keyword, schemas) {
      super();
      this.name = "JsonSchemaMergeError";
      this.code = "JSON_SCHEMA_MERGE_ERROR";
      this.message = `Failed to merge "${keyword}" keyword schemas.`;
      this.schemas = schemas;
    }
  }

  class ResolverNotFoundError extends Error {
    constructor(keyword, schemas) {
      super();
      this.name = "JsonSchemaMergeError";
      this.code = "JSON_SCHEMA_MERGE_ERROR";
      this.message = `Resolver for "${keyword}" keyword not found.`;
      this.schemas = schemas;
    }
  }

  class InvalidOnConflictOptionError extends Error {
    constructor(onConflict) {
      super();
      this.name = "JsonSchemaMergeError";
      this.code = "JSON_SCHEMA_MERGE_ERROR";
      this.message = `Invalid "onConflict" option: "${onConflict}".`;
    }
  }
  module.exports = {
    MergeError,
    ResolverNotFoundError,
    InvalidOnConflictOptionError
  };
});

// node_modules/.pnpm/@fastify+merge-json-schemas@0.1.1/node_modules/@fastify/merge-json-schemas/lib/resolvers.js
var require_resolvers = __commonJS((exports, module) => {
  var deepEqual = require_fast_deep_equal();
  var { MergeError } = require_errors2();
  function _arraysIntersection(arrays) {
    let intersection = arrays[0];
    for (let i = 1;i < arrays.length; i++) {
      intersection = intersection.filter((value) => arrays[i].includes(value));
    }
    return intersection;
  }
  function arraysIntersection(keyword, values, mergedSchema) {
    const intersection = _arraysIntersection(values);
    if (intersection.length === 0) {
      throw new MergeError(keyword, values);
    }
    mergedSchema[keyword] = intersection;
  }
  function hybridArraysIntersection(keyword, values, mergedSchema) {
    for (let i = 0;i < values.length; i++) {
      if (!Array.isArray(values[i])) {
        values[i] = [values[i]];
      }
    }
    const intersection = _arraysIntersection(values);
    if (intersection.length === 0) {
      throw new MergeError(keyword, values);
    }
    if (intersection.length === 1) {
      mergedSchema[keyword] = intersection[0];
    } else {
      mergedSchema[keyword] = intersection;
    }
  }
  function arraysUnion(keyword, values, mergedSchema) {
    const union = [];
    for (const array of values) {
      for (const value of array) {
        if (!union.includes(value)) {
          union.push(value);
        }
      }
    }
    mergedSchema[keyword] = union;
  }
  function minNumber(keyword, values, mergedSchema) {
    mergedSchema[keyword] = Math.min(...values);
  }
  function maxNumber(keyword, values, mergedSchema) {
    mergedSchema[keyword] = Math.max(...values);
  }
  function commonMultiple(keyword, values, mergedSchema) {
    const gcd = (a, b) => !b ? a : gcd(b, a % b);
    const lcm = (a, b) => a * b / gcd(a, b);
    let scale = 1;
    for (const value of values) {
      while (value * scale % 1 !== 0) {
        scale *= 10;
      }
    }
    let multiple = values[0] * scale;
    for (const value of values) {
      multiple = lcm(multiple, value * scale);
    }
    mergedSchema[keyword] = multiple / scale;
  }
  function allEqual(keyword, values, mergedSchema) {
    const firstValue = values[0];
    for (let i = 1;i < values.length; i++) {
      if (!deepEqual(values[i], firstValue)) {
        throw new MergeError(keyword, values);
      }
    }
    mergedSchema[keyword] = firstValue;
  }
  function skip() {}
  function booleanAnd(keyword, values, mergedSchema) {
    for (const value of values) {
      if (value === false) {
        mergedSchema[keyword] = false;
        return;
      }
    }
    mergedSchema[keyword] = true;
  }
  function booleanOr(keyword, values, mergedSchema) {
    for (const value of values) {
      if (value === true) {
        mergedSchema[keyword] = true;
        return;
      }
    }
    mergedSchema[keyword] = false;
  }
  module.exports = {
    arraysIntersection,
    hybridArraysIntersection,
    arraysUnion,
    minNumber,
    maxNumber,
    commonMultiple,
    allEqual,
    booleanAnd,
    booleanOr,
    skip
  };
});

// node_modules/.pnpm/@fastify+merge-json-schemas@0.1.1/node_modules/@fastify/merge-json-schemas/index.js
var require_merge_json_schemas = __commonJS((exports, module) => {
  var deepEqual = require_fast_deep_equal();
  var resolvers = require_resolvers();
  var errors = require_errors2();
  var keywordsResolvers = {
    $id: resolvers.skip,
    type: resolvers.hybridArraysIntersection,
    enum: resolvers.arraysIntersection,
    minLength: resolvers.maxNumber,
    maxLength: resolvers.minNumber,
    minimum: resolvers.maxNumber,
    maximum: resolvers.minNumber,
    multipleOf: resolvers.commonMultiple,
    exclusiveMinimum: resolvers.maxNumber,
    exclusiveMaximum: resolvers.minNumber,
    minItems: resolvers.maxNumber,
    maxItems: resolvers.minNumber,
    maxProperties: resolvers.minNumber,
    minProperties: resolvers.maxNumber,
    const: resolvers.allEqual,
    default: resolvers.allEqual,
    format: resolvers.allEqual,
    required: resolvers.arraysUnion,
    properties: mergeProperties,
    patternProperties: mergeObjects,
    additionalProperties: mergeSchemasResolver,
    items: mergeItems,
    additionalItems: mergeAdditionalItems,
    definitions: mergeObjects,
    $defs: mergeObjects,
    nullable: resolvers.booleanAnd,
    oneOf: mergeOneOf,
    anyOf: mergeOneOf,
    allOf: resolvers.arraysUnion,
    not: mergeSchemasResolver,
    if: mergeIfThenElseSchemas,
    then: resolvers.skip,
    else: resolvers.skip,
    dependencies: mergeDependencies,
    dependentRequired: mergeDependencies,
    dependentSchemas: mergeObjects,
    propertyNames: mergeSchemasResolver,
    uniqueItems: resolvers.booleanOr,
    contains: mergeSchemasResolver
  };
  function mergeSchemasResolver(keyword, values, mergedSchema, schemas, options) {
    mergedSchema[keyword] = _mergeSchemas(values, options);
  }
  function cartesianProduct(arrays) {
    let result = [[]];
    for (const array of arrays) {
      const temp = [];
      for (const x of result) {
        for (const y of array) {
          temp.push([...x, y]);
        }
      }
      result = temp;
    }
    return result;
  }
  function mergeOneOf(keyword, values, mergedSchema, schemas, options) {
    if (values.length === 1) {
      mergedSchema[keyword] = values[0];
      return;
    }
    const product = cartesianProduct(values);
    const mergedOneOf = [];
    for (const combination of product) {
      try {
        const mergedSchema2 = _mergeSchemas(combination, options);
        if (mergedSchema2 !== undefined) {
          mergedOneOf.push(mergedSchema2);
        }
      } catch (error) {
        if (error instanceof errors.MergeError)
          continue;
        throw error;
      }
    }
    mergedSchema[keyword] = mergedOneOf;
  }
  function getSchemaForItem(schema, index) {
    const { items, additionalItems } = schema;
    if (Array.isArray(items)) {
      if (index < items.length) {
        return items[index];
      }
      return additionalItems;
    }
    if (items !== undefined) {
      return items;
    }
    return additionalItems;
  }
  function mergeItems(keyword, values, mergedSchema, schemas, options) {
    let maxArrayItemsLength = 0;
    for (const itemsSchema of values) {
      if (Array.isArray(itemsSchema)) {
        maxArrayItemsLength = Math.max(maxArrayItemsLength, itemsSchema.length);
      }
    }
    if (maxArrayItemsLength === 0) {
      mergedSchema[keyword] = _mergeSchemas(values, options);
      return;
    }
    const mergedItemsSchemas = [];
    for (let i = 0;i < maxArrayItemsLength; i++) {
      const indexItemSchemas = [];
      for (const schema of schemas) {
        const itemSchema = getSchemaForItem(schema, i);
        if (itemSchema !== undefined) {
          indexItemSchemas.push(itemSchema);
        }
      }
      mergedItemsSchemas[i] = _mergeSchemas(indexItemSchemas, options);
    }
    mergedSchema[keyword] = mergedItemsSchemas;
  }
  function mergeAdditionalItems(keyword, values, mergedSchema, schemas, options) {
    let hasArrayItems = false;
    for (const schema of schemas) {
      if (Array.isArray(schema.items)) {
        hasArrayItems = true;
        break;
      }
    }
    if (!hasArrayItems) {
      mergedSchema[keyword] = _mergeSchemas(values, options);
      return;
    }
    const mergedAdditionalItemsSchemas = [];
    for (const schema of schemas) {
      let additionalItemsSchema = schema.additionalItems;
      if (additionalItemsSchema === undefined && !Array.isArray(schema.items)) {
        additionalItemsSchema = schema.items;
      }
      if (additionalItemsSchema !== undefined) {
        mergedAdditionalItemsSchemas.push(additionalItemsSchema);
      }
    }
    mergedSchema[keyword] = _mergeSchemas(mergedAdditionalItemsSchemas, options);
  }
  function getSchemaForProperty(schema, propertyName) {
    const { properties, patternProperties, additionalProperties } = schema;
    if (properties?.[propertyName] !== undefined) {
      return properties[propertyName];
    }
    for (const pattern of Object.keys(patternProperties ?? {})) {
      const regexp = new RegExp(pattern);
      if (regexp.test(propertyName)) {
        return patternProperties[pattern];
      }
    }
    return additionalProperties;
  }
  function mergeProperties(keyword, values, mergedSchema, schemas, options) {
    const foundProperties = {};
    for (const currentSchema of schemas) {
      const properties = currentSchema.properties ?? {};
      for (const propertyName of Object.keys(properties)) {
        if (foundProperties[propertyName] !== undefined)
          continue;
        const propertySchema = properties[propertyName];
        foundProperties[propertyName] = [propertySchema];
        for (const anotherSchema of schemas) {
          if (currentSchema === anotherSchema)
            continue;
          const propertySchema2 = getSchemaForProperty(anotherSchema, propertyName);
          if (propertySchema2 !== undefined) {
            foundProperties[propertyName].push(propertySchema2);
          }
        }
      }
    }
    const mergedProperties = {};
    for (const property of Object.keys(foundProperties)) {
      const propertySchemas = foundProperties[property];
      mergedProperties[property] = _mergeSchemas(propertySchemas, options);
    }
    mergedSchema[keyword] = mergedProperties;
  }
  function mergeObjects(keyword, values, mergedSchema, schemas, options) {
    const objectsProperties = {};
    for (const properties of values) {
      for (const propertyName of Object.keys(properties)) {
        if (objectsProperties[propertyName] === undefined) {
          objectsProperties[propertyName] = [];
        }
        objectsProperties[propertyName].push(properties[propertyName]);
      }
    }
    const mergedProperties = {};
    for (const propertyName of Object.keys(objectsProperties)) {
      const propertySchemas = objectsProperties[propertyName];
      const mergedPropertySchema = _mergeSchemas(propertySchemas, options);
      mergedProperties[propertyName] = mergedPropertySchema;
    }
    mergedSchema[keyword] = mergedProperties;
  }
  function mergeIfThenElseSchemas(keyword, values, mergedSchema, schemas, options) {
    for (let i = 0;i < schemas.length; i++) {
      const subSchema = {
        if: schemas[i].if,
        then: schemas[i].then,
        else: schemas[i].else
      };
      if (subSchema.if === undefined)
        continue;
      if (mergedSchema.if === undefined) {
        mergedSchema.if = subSchema.if;
        if (subSchema.then !== undefined) {
          mergedSchema.then = subSchema.then;
        }
        if (subSchema.else !== undefined) {
          mergedSchema.else = subSchema.else;
        }
        continue;
      }
      if (mergedSchema.then !== undefined) {
        mergedSchema.then = _mergeSchemas([mergedSchema.then, subSchema], options);
      }
      if (mergedSchema.else !== undefined) {
        mergedSchema.else = _mergeSchemas([mergedSchema.else, subSchema], options);
      }
    }
  }
  function mergeDependencies(keyword, values, mergedSchema) {
    const mergedDependencies = {};
    for (const dependencies of values) {
      for (const propertyName of Object.keys(dependencies)) {
        if (mergedDependencies[propertyName] === undefined) {
          mergedDependencies[propertyName] = [];
        }
        const mergedPropertyDependencies = mergedDependencies[propertyName];
        for (const propertyDependency of dependencies[propertyName]) {
          if (!mergedPropertyDependencies.includes(propertyDependency)) {
            mergedPropertyDependencies.push(propertyDependency);
          }
        }
      }
    }
    mergedSchema[keyword] = mergedDependencies;
  }
  function _mergeSchemas(schemas, options) {
    if (schemas.length === 0)
      return {};
    if (schemas.length === 1)
      return schemas[0];
    const mergedSchema = {};
    const keywords = {};
    let allSchemasAreTrue = true;
    for (const schema of schemas) {
      if (schema === false)
        return false;
      if (schema === true)
        continue;
      allSchemasAreTrue = false;
      for (const keyword of Object.keys(schema)) {
        if (keywords[keyword] === undefined) {
          keywords[keyword] = [];
        }
        keywords[keyword].push(schema[keyword]);
      }
    }
    if (allSchemasAreTrue)
      return true;
    for (const keyword of Object.keys(keywords)) {
      const keywordValues = keywords[keyword];
      const resolver = options.resolvers[keyword] ?? options.defaultResolver;
      resolver(keyword, keywordValues, mergedSchema, schemas, options);
    }
    return mergedSchema;
  }
  function defaultResolver(keyword, values, mergedSchema, schemas, options) {
    const onConflict = options.onConflict ?? "throw";
    if (values.length === 1 || onConflict === "first") {
      mergedSchema[keyword] = values[0];
      return;
    }
    let allValuesEqual = true;
    for (let i = 1;i < values.length; i++) {
      if (!deepEqual(values[i], values[0])) {
        allValuesEqual = false;
        break;
      }
    }
    if (allValuesEqual) {
      mergedSchema[keyword] = values[0];
      return;
    }
    if (onConflict === "throw") {
      throw new errors.ResolverNotFoundError(keyword, values);
    }
    if (onConflict === "skip") {
      return;
    }
    throw new errors.InvalidOnConflictOptionError(onConflict);
  }
  function mergeSchemas(schemas, options = {}) {
    if (options.defaultResolver === undefined) {
      options.defaultResolver = defaultResolver;
    }
    options.resolvers = { ...keywordsResolvers, ...options.resolvers };
    const mergedSchema = _mergeSchemas(schemas, options);
    return mergedSchema;
  }
  module.exports = { mergeSchemas, keywordsResolvers, defaultResolver, ...errors };
});

// node_modules/.pnpm/fast-json-stringify@5.16.1/node_modules/fast-json-stringify/lib/merge-schemas.js
var require_merge_schemas = __commonJS((exports, module) => {
  var { mergeSchemas: _mergeSchemas } = require_merge_json_schemas();
  function mergeSchemas(schemas) {
    return _mergeSchemas(schemas, { onConflict: "skip" });
  }
  module.exports = mergeSchemas;
});

// node_modules/.pnpm/fast-json-stringify@5.16.1/node_modules/fast-json-stringify/lib/standalone.js
var require_standalone = __commonJS((exports, module) => {
  function buildStandaloneCode(contextFunc, context, serializer, validator) {
    let ajvDependencyCode = "";
    if (context.validatorSchemasIds.size > 0) {
      ajvDependencyCode += `const Validator = require('fast-json-stringify/lib/validator')
`;
      ajvDependencyCode += `const validatorState = ${JSON.stringify(validator.getState())}
`;
      ajvDependencyCode += `const validator = Validator.restoreFromState(validatorState)
`;
    } else {
      ajvDependencyCode += `const validator = null
`;
    }
    const { schema, ...serializerState } = serializer.getState();
    return `
  'use strict'

  const Serializer = require('fast-json-stringify/lib/serializer')
  const serializerState = ${JSON.stringify(serializerState)}
  const serializer = Serializer.restoreFromState(serializerState)

  ${ajvDependencyCode}

  module.exports = ${contextFunc.toString()}(validator, serializer)`;
  }
  module.exports = buildStandaloneCode;
  module.exports.dependencies = {
    Serializer: require_serializer(),
    Validator: require_validator()
  };
});

// node_modules/.pnpm/fast-json-stringify@5.16.1/node_modules/fast-json-stringify/index.js
var require_fast_json_stringify = __commonJS((exports, module) => {
  var { RefResolver } = require_json_schema_ref_resolver();
  var Serializer = require_serializer();
  var Validator = require_validator();
  var Location = require_location();
  var validate = require_schema_validator();
  var mergeSchemas = require_merge_schemas();
  var SINGLE_TICK = /'/g;
  var largeArraySize = 20000;
  var largeArrayMechanism = "default";
  var validRoundingMethods = [
    "floor",
    "ceil",
    "round",
    "trunc"
  ];
  var validLargeArrayMechanisms = [
    "default",
    "json-stringify"
  ];
  var schemaIdCounter = 0;
  function isValidSchema(schema, name) {
    if (!validate(schema)) {
      if (name) {
        name = `"${name}" `;
      } else {
        name = "";
      }
      const first = validate.errors[0];
      const err = new Error(`${name}schema is invalid: data${first.instancePath} ${first.message}`);
      err.errors = isValidSchema.errors;
      throw err;
    }
  }
  function resolveRef(context, location) {
    const ref = location.schema.$ref;
    let hashIndex = ref.indexOf("#");
    if (hashIndex === -1) {
      hashIndex = ref.length;
    }
    const schemaId = ref.slice(0, hashIndex) || location.schemaId;
    const jsonPointer = ref.slice(hashIndex) || "#";
    const schema = context.refResolver.getSchema(schemaId, jsonPointer);
    if (schema === null) {
      throw new Error(`Cannot find reference "${ref}"`);
    }
    const newLocation = new Location(schema, schemaId, jsonPointer);
    if (schema.$ref !== undefined) {
      return resolveRef(context, newLocation);
    }
    return newLocation;
  }
  function getMergedLocation(context, mergedSchemaId) {
    const mergedSchema = context.refResolver.getSchema(mergedSchemaId, "#");
    return new Location(mergedSchema, mergedSchemaId, "#");
  }
  function getSchemaId(schema, rootSchemaId) {
    if (schema.$id && schema.$id.charAt(0) !== "#") {
      return schema.$id;
    }
    return rootSchemaId;
  }
  function build(schema, options) {
    isValidSchema(schema);
    options = options || {};
    const context = {
      functions: [],
      functionsCounter: 0,
      functionsNamesBySchema: new Map,
      options,
      refResolver: new RefResolver,
      rootSchemaId: schema.$id || `__fjs_root_${schemaIdCounter++}`,
      validatorSchemasIds: new Set,
      mergedSchemasIds: new Map
    };
    const schemaId = getSchemaId(schema, context.rootSchemaId);
    if (!context.refResolver.hasSchema(schemaId)) {
      context.refResolver.addSchema(schema, context.rootSchemaId);
    }
    if (options.schema) {
      for (const key in options.schema) {
        const schema2 = options.schema[key];
        const schemaId2 = getSchemaId(schema2, key);
        if (!context.refResolver.hasSchema(schemaId2)) {
          isValidSchema(schema2, key);
          context.refResolver.addSchema(schema2, key);
        }
      }
    }
    if (options.rounding) {
      if (!validRoundingMethods.includes(options.rounding)) {
        throw new Error(`Unsupported integer rounding method ${options.rounding}`);
      }
    }
    if (options.largeArrayMechanism) {
      if (validLargeArrayMechanisms.includes(options.largeArrayMechanism)) {
        largeArrayMechanism = options.largeArrayMechanism;
      } else {
        throw new Error(`Unsupported large array mechanism ${options.largeArrayMechanism}`);
      }
    }
    if (options.largeArraySize) {
      if (typeof options.largeArraySize === "string" && Number.isFinite(Number.parseInt(options.largeArraySize, 10))) {
        largeArraySize = Number.parseInt(options.largeArraySize, 10);
      } else if (typeof options.largeArraySize === "number" && Number.isInteger(options.largeArraySize)) {
        largeArraySize = options.largeArraySize;
      } else if (typeof options.largeArraySize === "bigint") {
        largeArraySize = Number(options.largeArraySize);
      } else {
        throw new Error(`Unsupported large array size. Expected integer-like, got ${typeof options.largeArraySize} with value ${options.largeArraySize}`);
      }
    }
    const location = new Location(schema, context.rootSchemaId);
    const code = buildValue(context, location, "input");
    let contextFunctionCode = `
    const JSON_STR_BEGIN_OBJECT = '{'
    const JSON_STR_END_OBJECT = '}'
    const JSON_STR_BEGIN_ARRAY = '['
    const JSON_STR_END_ARRAY = ']'
    const JSON_STR_COMMA = ','
    const JSON_STR_COLONS = ':'
    const JSON_STR_QUOTE = '"'
    const JSON_STR_EMPTY_OBJECT = JSON_STR_BEGIN_OBJECT + JSON_STR_END_OBJECT
    const JSON_STR_EMPTY_ARRAY = JSON_STR_BEGIN_ARRAY + JSON_STR_END_ARRAY
    const JSON_STR_EMPTY_STRING = JSON_STR_QUOTE + JSON_STR_QUOTE
    const JSON_STR_NULL = 'null'
  `;
    if (code === "json += anonymous0(input)") {
      contextFunctionCode += `
    ${context.functions.join(`
`)}
    const main = anonymous0
    return main
    `;
    } else {
      contextFunctionCode += `
    function main (input) {
      let json = ''
      ${code}
      return json
    }
    ${context.functions.join(`
`)}
    return main
    `;
    }
    const serializer = new Serializer(options);
    const validator = new Validator(options.ajv);
    for (const schemaId2 of context.validatorSchemasIds) {
      const schema2 = context.refResolver.getSchema(schemaId2);
      validator.addSchema(schema2, schemaId2);
      const dependencies = context.refResolver.getSchemaDependencies(schemaId2);
      for (const [schemaId3, schema3] of Object.entries(dependencies)) {
        validator.addSchema(schema3, schemaId3);
      }
    }
    if (options.debugMode) {
      options.mode = "debug";
    }
    if (options.mode === "debug") {
      return {
        validator,
        serializer,
        code: `validator
serializer
${contextFunctionCode}`,
        ajv: validator.ajv
      };
    }
    const contextFunc = new Function("validator", "serializer", contextFunctionCode);
    if (options.mode === "standalone") {
      const buildStandaloneCode = require_standalone();
      return buildStandaloneCode(contextFunc, context, serializer, validator);
    }
    return contextFunc(validator, serializer);
  }
  var objectKeywords = [
    "properties",
    "required",
    "additionalProperties",
    "patternProperties",
    "maxProperties",
    "minProperties",
    "dependencies"
  ];
  var arrayKeywords = [
    "items",
    "additionalItems",
    "maxItems",
    "minItems",
    "uniqueItems",
    "contains"
  ];
  var stringKeywords = [
    "maxLength",
    "minLength",
    "pattern"
  ];
  var numberKeywords = [
    "multipleOf",
    "maximum",
    "exclusiveMaximum",
    "minimum",
    "exclusiveMinimum"
  ];
  function inferTypeByKeyword(schema) {
    for (var keyword of objectKeywords) {
      if (keyword in schema)
        return "object";
    }
    for (var keyword of arrayKeywords) {
      if (keyword in schema)
        return "array";
    }
    for (var keyword of stringKeywords) {
      if (keyword in schema)
        return "string";
    }
    for (var keyword of numberKeywords) {
      if (keyword in schema)
        return "number";
    }
    return schema.type;
  }
  function buildExtraObjectPropertiesSerializer(context, location, addComma) {
    const schema = location.schema;
    const propertiesKeys = Object.keys(schema.properties || {});
    let code = `
    const propertiesKeys = ${JSON.stringify(propertiesKeys)}
    for (const [key, value] of Object.entries(obj)) {
      if (
        propertiesKeys.includes(key) ||
        value === undefined ||
        typeof value === 'function' ||
        typeof value === 'symbol'
      ) continue
  `;
    const patternPropertiesLocation = location.getPropertyLocation("patternProperties");
    const patternPropertiesSchema = patternPropertiesLocation.schema;
    if (patternPropertiesSchema !== undefined) {
      for (const propertyKey in patternPropertiesSchema) {
        const propertyLocation = patternPropertiesLocation.getPropertyLocation(propertyKey);
        code += `
        if (/${propertyKey.replace(/\\*\//g, "\\/")}/.test(key)) {
          ${addComma}
          json += serializer.asString(key) + JSON_STR_COLONS
          ${buildValue(context, propertyLocation, "value")}
          continue
        }
      `;
      }
    }
    const additionalPropertiesLocation = location.getPropertyLocation("additionalProperties");
    const additionalPropertiesSchema = additionalPropertiesLocation.schema;
    if (additionalPropertiesSchema !== undefined) {
      if (additionalPropertiesSchema === true) {
        code += `
        ${addComma}
        json += serializer.asString(key) + JSON_STR_COLONS + JSON.stringify(value)
      `;
      } else {
        const propertyLocation = location.getPropertyLocation("additionalProperties");
        code += `
        ${addComma}
        json += serializer.asString(key) + JSON_STR_COLONS
        ${buildValue(context, propertyLocation, "value")}
      `;
      }
    }
    code += `
    }
  `;
    return code;
  }
  function buildInnerObject(context, location) {
    const schema = location.schema;
    const propertiesLocation = location.getPropertyLocation("properties");
    const requiredProperties = schema.required || [];
    const propertiesKeys = Object.keys(schema.properties || {}).sort((key1, key2) => {
      const required1 = requiredProperties.includes(key1);
      const required2 = requiredProperties.includes(key2);
      return required1 === required2 ? 0 : required1 ? -1 : 1;
    });
    const hasRequiredProperties = requiredProperties.includes(propertiesKeys[0]);
    let code = `let value
`;
    for (const key of requiredProperties) {
      if (!propertiesKeys.includes(key)) {
        const sanitizedKey = JSON.stringify(key);
        code += `if (obj[${sanitizedKey}] === undefined) throw new Error('${sanitizedKey.replace(/'/g, "\\'")} is required!')
`;
      }
    }
    code += `let json = JSON_STR_BEGIN_OBJECT
`;
    let addComma = "";
    if (!hasRequiredProperties) {
      code += `let addComma = false
`;
      addComma = "!addComma && (addComma = true) || (json += JSON_STR_COMMA)";
    }
    for (const key of propertiesKeys) {
      let propertyLocation = propertiesLocation.getPropertyLocation(key);
      if (propertyLocation.schema.$ref) {
        propertyLocation = resolveRef(context, propertyLocation);
      }
      const sanitizedKey = JSON.stringify(key);
      const defaultValue = propertyLocation.schema.default;
      const isRequired = requiredProperties.includes(key);
      code += `
      value = obj[${sanitizedKey}]
      if (value !== undefined) {
        ${addComma}
        json += ${JSON.stringify(sanitizedKey + ":")}
        ${buildValue(context, propertyLocation, "value")}
      }`;
      if (defaultValue !== undefined) {
        code += ` else {
        ${addComma}
        json += ${JSON.stringify(sanitizedKey + ":" + JSON.stringify(defaultValue))}
      }
      `;
      } else if (isRequired) {
        code += ` else {
        throw new Error('${sanitizedKey.replace(/'/g, "\\'")} is required!')
      }
      `;
      } else {
        code += `
`;
      }
      if (hasRequiredProperties) {
        addComma = "json += ','";
      }
    }
    if (schema.patternProperties || schema.additionalProperties) {
      code += buildExtraObjectPropertiesSerializer(context, location, addComma);
    }
    code += `
    return json + JSON_STR_END_OBJECT
  `;
    return code;
  }
  function mergeLocations(context, mergedSchemaId, mergedLocations) {
    for (let i = 0;i < mergedLocations.length; i++) {
      const location = mergedLocations[i];
      const schema = location.schema;
      if (schema.$ref) {
        mergedLocations[i] = resolveRef(context, location);
      }
    }
    const mergedSchemas = [];
    for (const location of mergedLocations) {
      const schema = cloneOriginSchema(context, location.schema, location.schemaId);
      delete schema.$id;
      mergedSchemas.push(schema);
    }
    const mergedSchema = mergeSchemas(mergedSchemas);
    const mergedLocation = new Location(mergedSchema, mergedSchemaId);
    context.refResolver.addSchema(mergedSchema, mergedSchemaId);
    return mergedLocation;
  }
  function cloneOriginSchema(context, schema, schemaId) {
    const clonedSchema = Array.isArray(schema) ? [] : {};
    if (schema.$id !== undefined && schema.$id.charAt(0) !== "#") {
      schemaId = schema.$id;
    }
    const mergedSchemaRef = context.mergedSchemasIds.get(schema);
    if (mergedSchemaRef) {
      context.mergedSchemasIds.set(clonedSchema, mergedSchemaRef);
    }
    for (const key in schema) {
      let value = schema[key];
      if (key === "$ref" && typeof value === "string" && value.charAt(0) === "#") {
        value = schemaId + value;
      }
      if (typeof value === "object" && value !== null) {
        value = cloneOriginSchema(context, value, schemaId);
      }
      clonedSchema[key] = value;
    }
    return clonedSchema;
  }
  function toJSON(variableName) {
    return `(${variableName} && typeof ${variableName}.toJSON === 'function')
    ? ${variableName}.toJSON()
    : ${variableName}
  `;
  }
  function buildObject(context, location) {
    const schema = location.schema;
    if (context.functionsNamesBySchema.has(schema)) {
      return context.functionsNamesBySchema.get(schema);
    }
    const functionName = generateFuncName(context);
    context.functionsNamesBySchema.set(schema, functionName);
    let schemaRef = location.getSchemaRef();
    if (schemaRef.startsWith(context.rootSchemaId)) {
      schemaRef = schemaRef.replace(context.rootSchemaId, "");
    }
    let functionCode = `
  `;
    const nullable = schema.nullable === true;
    functionCode += `
    // ${schemaRef}
    function ${functionName} (input) {
      const obj = ${toJSON("input")}
      ${!nullable ? "if (obj === null) return JSON_STR_EMPTY_OBJECT" : ""}

      ${buildInnerObject(context, location)}
    }
  `;
    context.functions.push(functionCode);
    return functionName;
  }
  function buildArray(context, location) {
    const schema = location.schema;
    let itemsLocation = location.getPropertyLocation("items");
    itemsLocation.schema = itemsLocation.schema || {};
    if (itemsLocation.schema.$ref) {
      itemsLocation = resolveRef(context, itemsLocation);
    }
    const itemsSchema = itemsLocation.schema;
    if (context.functionsNamesBySchema.has(schema)) {
      return context.functionsNamesBySchema.get(schema);
    }
    const functionName = generateFuncName(context);
    context.functionsNamesBySchema.set(schema, functionName);
    let schemaRef = location.getSchemaRef();
    if (schemaRef.startsWith(context.rootSchemaId)) {
      schemaRef = schemaRef.replace(context.rootSchemaId, "");
    }
    let functionCode = `
    function ${functionName} (obj) {
      // ${schemaRef}
  `;
    const nullable = schema.nullable === true;
    functionCode += `
    ${!nullable ? "if (obj === null) return JSON_STR_EMPTY_ARRAY" : ""}
    if (!Array.isArray(obj)) {
      throw new TypeError(\`The value of '${schemaRef}' does not match schema definition.\`)
    }
    const arrayLength = obj.length
  `;
    if (!schema.additionalItems && Array.isArray(itemsSchema)) {
      functionCode += `
      if (arrayLength > ${itemsSchema.length}) {
        throw new Error(\`Item at ${itemsSchema.length} does not match schema definition.\`)
      }
    `;
    }
    if (largeArrayMechanism === "json-stringify") {
      functionCode += `if (arrayLength >= ${largeArraySize}) return JSON.stringify(obj)
`;
    }
    functionCode += `
    const arrayEnd = arrayLength - 1
    let value
    let json = ''
  `;
    if (Array.isArray(itemsSchema)) {
      for (let i = 0;i < itemsSchema.length; i++) {
        const item = itemsSchema[i];
        functionCode += `value = obj[${i}]`;
        const tmpRes = buildValue(context, itemsLocation.getPropertyLocation(i), "value");
        functionCode += `
        if (${i} < arrayLength) {
          if (${buildArrayTypeCondition(item.type, `[${i}]`)}) {
            ${tmpRes}
            if (${i} < arrayEnd) {
              json += JSON_STR_COMMA
            }
          } else {
            throw new Error(\`Item at ${i} does not match schema definition.\`)
          }
        }
        `;
      }
      if (schema.additionalItems) {
        functionCode += `
        for (let i = ${itemsSchema.length}; i < arrayLength; i++) {
          json += JSON.stringify(obj[i])
          if (i < arrayEnd) {
            json += JSON_STR_COMMA
          }
        }`;
      }
    } else {
      const code = buildValue(context, itemsLocation, "obj[i]");
      functionCode += `
      for (let i = 0; i < arrayLength; i++) {
        ${code}
        if (i < arrayEnd) {
          json += JSON_STR_COMMA
        }
      }`;
    }
    functionCode += `
    return JSON_STR_BEGIN_ARRAY + json + JSON_STR_END_ARRAY
  }`;
    context.functions.push(functionCode);
    return functionName;
  }
  function buildArrayTypeCondition(type, accessor) {
    let condition;
    switch (type) {
      case "null":
        condition = "value === null";
        break;
      case "string":
        condition = `typeof value === 'string' ||
      value === null ||
      value instanceof Date ||
      value instanceof RegExp ||
      (
        typeof value === "object" &&
        typeof value.toString === "function" &&
        value.toString !== Object.prototype.toString
      )`;
        break;
      case "integer":
        condition = "Number.isInteger(value)";
        break;
      case "number":
        condition = "Number.isFinite(value)";
        break;
      case "boolean":
        condition = "typeof value === 'boolean'";
        break;
      case "object":
        condition = "value && typeof value === 'object' && value.constructor === Object";
        break;
      case "array":
        condition = "Array.isArray(value)";
        break;
      default:
        if (Array.isArray(type)) {
          const conditions = type.map((subType) => {
            return buildArrayTypeCondition(subType, accessor);
          });
          condition = `(${conditions.join(" || ")})`;
        }
    }
    return condition;
  }
  function generateFuncName(context) {
    return "anonymous" + context.functionsCounter++;
  }
  function buildMultiTypeSerializer(context, location, input) {
    const schema = location.schema;
    const types = schema.type.sort((t1) => t1 === "null" ? -1 : 1);
    let code = "";
    types.forEach((type, index) => {
      location.schema = { ...location.schema, type };
      const nestedResult = buildSingleTypeSerializer(context, location, input);
      const statement = index === 0 ? "if" : "else if";
      switch (type) {
        case "null":
          code += `
          ${statement} (${input} === null)
            ${nestedResult}
          `;
          break;
        case "string": {
          code += `
          ${statement}(
            typeof ${input} === "string" ||
            ${input} === null ||
            ${input} instanceof Date ||
            ${input} instanceof RegExp ||
            (
              typeof ${input} === "object" &&
              typeof ${input}.toString === "function" &&
              ${input}.toString !== Object.prototype.toString
            )
          )
            ${nestedResult}
        `;
          break;
        }
        case "array": {
          code += `
          ${statement}(Array.isArray(${input}))
            ${nestedResult}
        `;
          break;
        }
        case "integer": {
          code += `
          ${statement}(Number.isInteger(${input}) || ${input} === null)
            ${nestedResult}
        `;
          break;
        }
        default: {
          code += `
          ${statement}(typeof ${input} === "${type}" || ${input} === null)
            ${nestedResult}
        `;
          break;
        }
      }
    });
    let schemaRef = location.getSchemaRef();
    if (schemaRef.startsWith(context.rootSchemaId)) {
      schemaRef = schemaRef.replace(context.rootSchemaId, "");
    }
    code += `
    else throw new TypeError(\`The value of '${schemaRef}' does not match schema definition.\`)
  `;
    return code;
  }
  function buildSingleTypeSerializer(context, location, input) {
    const schema = location.schema;
    switch (schema.type) {
      case "null":
        return "json += JSON_STR_NULL";
      case "string": {
        if (schema.format === "date-time") {
          return `json += serializer.asDateTime(${input})`;
        } else if (schema.format === "date") {
          return `json += serializer.asDate(${input})`;
        } else if (schema.format === "time") {
          return `json += serializer.asTime(${input})`;
        } else if (schema.format === "unsafe") {
          return `json += serializer.asUnsafeString(${input})`;
        } else {
          return `
        if (typeof ${input} !== 'string') {
          if (${input} === null) {
            json += JSON_STR_EMPTY_STRING
          } else if (${input} instanceof Date) {
            json += JSON_STR_QUOTE + ${input}.toISOString() + JSON_STR_QUOTE
          } else if (${input} instanceof RegExp) {
            json += serializer.asString(${input}.source)
          } else {
            json += serializer.asString(${input}.toString())
          }
        } else {
          json += serializer.asString(${input})
        }
        `;
        }
      }
      case "integer":
        return `json += serializer.asInteger(${input})`;
      case "number":
        return `json += serializer.asNumber(${input})`;
      case "boolean":
        return `json += serializer.asBoolean(${input})`;
      case "object": {
        const funcName = buildObject(context, location);
        return `json += ${funcName}(${input})`;
      }
      case "array": {
        const funcName = buildArray(context, location);
        return `json += ${funcName}(${input})`;
      }
      case undefined:
        return `json += JSON.stringify(${input})`;
      default:
        throw new Error(`${schema.type} unsupported`);
    }
  }
  function buildConstSerializer(location, input) {
    const schema = location.schema;
    const type = schema.type;
    const hasNullType = Array.isArray(type) && type.includes("null");
    let code = "";
    if (hasNullType) {
      code += `
      if (${input} === null) {
        json += JSON_STR_NULL
      } else {
    `;
    }
    code += `json += '${JSON.stringify(schema.const).replace(SINGLE_TICK, "\\'")}'`;
    if (hasNullType) {
      code += `
      }
    `;
    }
    return code;
  }
  function buildAllOf(context, location, input) {
    const schema = location.schema;
    let mergedSchemaId = context.mergedSchemasIds.get(schema);
    if (mergedSchemaId) {
      const mergedLocation2 = getMergedLocation(context, mergedSchemaId);
      return buildValue(context, mergedLocation2, input);
    }
    mergedSchemaId = `__fjs_merged_${schemaIdCounter++}`;
    context.mergedSchemasIds.set(schema, mergedSchemaId);
    const { allOf, ...schemaWithoutAllOf } = location.schema;
    const locations = [
      new Location(schemaWithoutAllOf, location.schemaId, location.jsonPointer)
    ];
    const allOfsLocation = location.getPropertyLocation("allOf");
    for (let i = 0;i < allOf.length; i++) {
      locations.push(allOfsLocation.getPropertyLocation(i));
    }
    const mergedLocation = mergeLocations(context, mergedSchemaId, locations);
    return buildValue(context, mergedLocation, input);
  }
  function buildOneOf(context, location, input) {
    context.validatorSchemasIds.add(location.schemaId);
    const schema = location.schema;
    const type = schema.anyOf ? "anyOf" : "oneOf";
    const { [type]: oneOfs, ...schemaWithoutAnyOf } = location.schema;
    const locationWithoutOneOf = new Location(schemaWithoutAnyOf, location.schemaId, location.jsonPointer);
    const oneOfsLocation = location.getPropertyLocation(type);
    let code = "";
    for (let index = 0;index < oneOfs.length; index++) {
      const optionLocation = oneOfsLocation.getPropertyLocation(index);
      const optionSchema = optionLocation.schema;
      let mergedSchemaId = context.mergedSchemasIds.get(optionSchema);
      let mergedLocation = null;
      if (mergedSchemaId) {
        mergedLocation = getMergedLocation(context, mergedSchemaId);
      } else {
        mergedSchemaId = `__fjs_merged_${schemaIdCounter++}`;
        context.mergedSchemasIds.set(optionSchema, mergedSchemaId);
        mergedLocation = mergeLocations(context, mergedSchemaId, [
          locationWithoutOneOf,
          optionLocation
        ]);
      }
      const nestedResult = buildValue(context, mergedLocation, input);
      const schemaRef2 = optionLocation.getSchemaRef();
      code += `
      ${index === 0 ? "if" : "else if"}(validator.validate("${schemaRef2}", ${input}))
        ${nestedResult}
    `;
    }
    let schemaRef = location.getSchemaRef();
    if (schemaRef.startsWith(context.rootSchemaId)) {
      schemaRef = schemaRef.replace(context.rootSchemaId, "");
    }
    code += `
    else throw new TypeError(\`The value of '${schemaRef}' does not match schema definition.\`)
  `;
    return code;
  }
  function buildIfThenElse(context, location, input) {
    context.validatorSchemasIds.add(location.schemaId);
    const {
      if: ifSchema,
      then: thenSchema,
      else: elseSchema,
      ...schemaWithoutIfThenElse
    } = location.schema;
    const rootLocation = new Location(schemaWithoutIfThenElse, location.schemaId, location.jsonPointer);
    const ifLocation = location.getPropertyLocation("if");
    const ifSchemaRef = ifLocation.getSchemaRef();
    const thenLocation = location.getPropertyLocation("then");
    let thenMergedSchemaId = context.mergedSchemasIds.get(thenSchema);
    let thenMergedLocation = null;
    if (thenMergedSchemaId) {
      thenMergedLocation = getMergedLocation(context, thenMergedSchemaId);
    } else {
      thenMergedSchemaId = `__fjs_merged_${schemaIdCounter++}`;
      context.mergedSchemasIds.set(thenSchema, thenMergedSchemaId);
      thenMergedLocation = mergeLocations(context, thenMergedSchemaId, [
        rootLocation,
        thenLocation
      ]);
    }
    if (!elseSchema) {
      return `
      if (validator.validate("${ifSchemaRef}", ${input})) {
        ${buildValue(context, thenMergedLocation, input)}
      } else {
        ${buildValue(context, rootLocation, input)}
      }
    `;
    }
    const elseLocation = location.getPropertyLocation("else");
    let elseMergedSchemaId = context.mergedSchemasIds.get(elseSchema);
    let elseMergedLocation = null;
    if (elseMergedSchemaId) {
      elseMergedLocation = getMergedLocation(context, elseMergedSchemaId);
    } else {
      elseMergedSchemaId = `__fjs_merged_${schemaIdCounter++}`;
      context.mergedSchemasIds.set(elseSchema, elseMergedSchemaId);
      elseMergedLocation = mergeLocations(context, elseMergedSchemaId, [
        rootLocation,
        elseLocation
      ]);
    }
    return `
    if (validator.validate("${ifSchemaRef}", ${input})) {
      ${buildValue(context, thenMergedLocation, input)}
    } else {
      ${buildValue(context, elseMergedLocation, input)}
    }
  `;
  }
  function buildValue(context, location, input) {
    let schema = location.schema;
    if (typeof schema === "boolean") {
      return `json += JSON.stringify(${input})`;
    }
    if (schema.$ref) {
      location = resolveRef(context, location);
      schema = location.schema;
    }
    if (schema.allOf) {
      return buildAllOf(context, location, input);
    }
    if (schema.anyOf || schema.oneOf) {
      return buildOneOf(context, location, input);
    }
    if (schema.if && schema.then) {
      return buildIfThenElse(context, location, input);
    }
    if (schema.type === undefined) {
      const inferredType = inferTypeByKeyword(schema);
      if (inferredType) {
        schema.type = inferredType;
      }
    }
    let code = "";
    const type = schema.type;
    const nullable = schema.nullable === true;
    if (nullable) {
      code += `
      if (${input} === null) {
        json += JSON_STR_NULL
      } else {
    `;
    }
    if (schema.const !== undefined) {
      code += buildConstSerializer(location, input);
    } else if (Array.isArray(type)) {
      code += buildMultiTypeSerializer(context, location, input);
    } else {
      code += buildSingleTypeSerializer(context, location, input);
    }
    if (nullable) {
      code += `
      }
    `;
    }
    return code;
  }
  module.exports = build;
  module.exports.default = build;
  module.exports.build = build;
  module.exports.validLargeArrayMechanisms = validLargeArrayMechanisms;
  module.exports.restore = function({ code, validator, serializer }) {
    return Function.apply(null, ["validator", "serializer", code]).apply(null, [validator, serializer]);
  };
});

// src/utils/json.ts
var import_fast_json_stringify = __toESM(require_fast_json_stringify(), 1);
function compileStringify(schema) {
  const s = import_fast_json_stringify.default(schema);
  return (data) => s(data);
}
export {
  compileStringify
};
