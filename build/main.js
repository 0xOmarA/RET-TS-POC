"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const buffer_1 = require("buffer");
class RadixEngineToolkit {
    /**
     * Creates new RadixEngineToolkit instance from an instance of the WASM module.
     * @param wasmInstance An instance of the Radix Engine Toolkit WASM module
     */
    constructor(wasmInstance) {
        this.wasmInstance = wasmInstance;
        this.internalFFI = wasmInstance.exports;
    }
    /**
     * Instantiates a new `RadixEngineToolkit` given a buffer of the contents of the WASM module.
     * @param buffer A buffer of the contents of the WASM module
     * @return A promise of an instance of a `RadixEngineToolkit`.
     */
    static fromWasmModuleBuffer(buffer) {
        return __awaiter(this, void 0, void 0, function* () {
            let wasmInstance = yield WebAssembly.instantiate(buffer);
            return new RadixEngineToolkit(wasmInstance.instance);
        });
    }
    /**
     * Instantiates a new `RadixEngineToolkit` given the path of the WASM module.
     * @param path The path of the RadixEngineToolkit WASM module.
     * @return A promise of an instance of a `RadixEngineToolkit`.
     */
    static fromPath(path) {
        return __awaiter(this, void 0, void 0, function* () {
            let contents = fs.readFileSync(path);
            return yield this.fromWasmModuleBuffer(contents);
        });
    }
    /**
     * Gets the transaction manifest string from a byte array of an unknown compiled intent.
     * @param compiledIntent A byte array of the unknown compiled intent
     * @return A string of the transaction manifest from the compiled intent or undefined if decompilation failed
     */
    manifestStringFromCompiledIntent(compiledIntent) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        let request = {
            "compiled_unknown_intent": buffer_1.Buffer.from(compiledIntent).toString("hex"),
            "manifest_instructions_output_format": "String"
        };
        let response = this.callWasmFunction(request, this.internalFFI.decompile_unknown_transaction_intent);
        return ((_d = (_c = (_b = (_a = response === null || response === void 0 ? void 0 : response["signed_intent"]) === null || _a === void 0 ? void 0 : _a["intent"]) === null || _b === void 0 ? void 0 : _b["manifest"]) === null || _c === void 0 ? void 0 : _c["instructions"]) === null || _d === void 0 ? void 0 : _d["value"])
            || ((_g = (_f = (_e = response === null || response === void 0 ? void 0 : response["intent"]) === null || _e === void 0 ? void 0 : _e["manifest"]) === null || _f === void 0 ? void 0 : _f["instructions"]) === null || _g === void 0 ? void 0 : _g["value"])
            || ((_j = (_h = response === null || response === void 0 ? void 0 : response["manifest"]) === null || _h === void 0 ? void 0 : _h["instructions"]) === null || _j === void 0 ? void 0 : _j["value"]);
    }
    /**
     * A high-level method for calling functions from the `RadixEngineToolkitFFI` through a simple interface.
     *
     * The main purpose of this method is to provide a higher-level interface for calling into the `RadixEngineToolkit`,
     * as such, this method performs all required memory allocation, deallocation, object serialization, deserialization
     * encoding, and decoding required for any call into the RadixEngineToolkit
     * @param request An object containing the request payload
     * @param wasmFunction The function to call of the `RadixEngineToolkitFFI`
     * @return A generic object of type `O` of the response to the request
     * @private
     */
    callWasmFunction(request, wasmFunction) {
        // Write the request object to memory and get a pointer to where it was written
        let requestPointer = this.writeObjectToMemory(request);
        // Call the WASM function with the request pointer
        let responsePointer = wasmFunction(requestPointer);
        // Read and deserialize the response
        let response = this.readObjectFromMemory(responsePointer);
        // Deallocate the request and response pointers
        this.deallocateMemory(requestPointer);
        this.deallocateMemory(responsePointer);
        // Return the object back to the caller
        return response;
    }
    /**
     * Allocates memory of a certain capacity on the WebAssembly instance's linear memory through the
     * `RadixEngineToolkit`'s internal memory allocator
     * @param capacity The capacity of the memory to allocate
     * @return A memory pointer of the allocated memory
     * @private
     */
    allocateMemory(capacity) {
        return this.internalFFI.toolkit_alloc(capacity);
    }
    /**
     * Deallocates memory beginning from the provided memory pointer and ending at the first null-terminator found
     * @param pointer A memory pointer to the starting location of the memory to deallocate
     * @private
     */
    deallocateMemory(pointer) {
        this.internalFFI.toolkit_free_c_string(pointer);
    }
    /**
     * Serializes an object to a JSON string
     * @param object The object to serialize
     * @return A string of the serialized representation
     * @private
     */
    serializeObject(object) {
        return JSON.stringify(object);
    }
    /**
     * Deserializes a JSON string to an object of the generic type `T`.
     * @param string The JSON string to deserialize.
     * @return A generic object of type T deserialized from the JSON string.
     * @private
     */
    deserializeString(string) {
        return JSON.parse(string);
    }
    /**
     * A method to write strings to memory in the way expected by the Radix Engine Toolkit.
     *
     * This method first UTF-8 encodes the passed string and adds a null-terminator to it. It then allocates enough
     * memory for the encoded string and writes it to memory. Finally, this method returns the pointer back to the
     * caller to use.
     *
     * Note: Since the pointer is returned to the caller, it is now the caller's burden to deallocate this memory when
     * it is no longer needed.
     *
     * @param str A string to write to memory
     * @return A pointer to the memory location containing the null-terminated UTF-8 encoded string
     * @private
     */
    writeStringToMemory(str) {
        // UTF-8 encode the string and add the null terminator to it.
        let nullTerminatedUtf8EncodedString = new Uint8Array([...new TextEncoder().encode(str), 0]);
        // Allocate memory for the string
        let memoryPointer = this.allocateMemory(nullTerminatedUtf8EncodedString.length);
        // Write the string to the instance's linear memory
        const view = new Uint8Array(this.internalFFI.memory.buffer, memoryPointer);
        view.set(nullTerminatedUtf8EncodedString);
        // return the memory pointer back to the caller
        return memoryPointer;
    }
    /**
     * This method reads a UTF-8 null-terminated string the instance's linear memory and returns it as a JS string.
     * @param pointer A pointer to the memory location containing the string
     * @return A JS string of the read and decoded string
     * @private
     */
    readStringFromMemory(pointer) {
        // Determine the length of the string based on the first null terminator
        const view = new Uint8Array(this.internalFFI.memory.buffer, pointer);
        const length = view.findIndex((byte) => byte === 0);
        // Read the UTF-8 encoded string from memory
        let nullTerminatedUtf8EncodedString = new Uint8Array(this.internalFFI.memory.buffer, pointer, length);
        // Decode the string and return it back to the caller
        return new TextDecoder().decode(nullTerminatedUtf8EncodedString);
    }
    /**
     * Writes an object to memory by serializing it to JSON and UTF-8 encoding the serialized string.
     * @param obj The object to write to the instance's linear memory.
     * @return A pointer to the location of the object in memory
     * @private
     */
    writeObjectToMemory(obj) {
        // Serialize the object to json
        let serializedObject = this.serializeObject(obj);
        // Write the string to memory and return the pointer
        return this.writeStringToMemory(serializedObject);
    }
    /**
     * Reads a UTF-8 encoded JSON string from memory and deserializes it as `T`.
     * @param pointer A memory pointer to the location of the linear memory where the object lives.
     * @return An object of type `T` of the deserialized object
     * @private
     */
    readObjectFromMemory(pointer) {
        // Read the UTF-8 encoded null-terminated string from memory
        let serializedObject = this.readStringFromMemory(pointer);
        // Deserialize and return to the caller
        return this.deserializeString(serializedObject);
    }
}
exports.default = RadixEngineToolkit;
const main = () => __awaiter(void 0, void 0, void 0, function* () {
    const rawHex = "5c21022102210221090701070b0aa0000000000000000a04010000000000000a6fa3e0dd02000000110e4563647361536563703235366b3101b10279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f8179801000900e1f505070021022011020a43616c6c4d6574686f640221021106476c6f62616c01810257dc042cd8cb916f3630020a1f337cec5a54cfefa4c5084fbe3c0c086c6f636b5f6665652007245c2101b5000010632d5ec76b0500000000000000000000000000000000000000000000000d436c656172417574685a6f6e6500202000201100110e4563647361536563703235366b3101b200a975ca80a401fd36cc6e67d01fc5b3561082169b69c68d262177baaec81952854219097bfaae71b3d446c8e33095002dcde0e92dd67c291417dc6b9eb341262d";
    let toolkit = yield RadixEngineToolkit.fromPath("/Users/omarabdulla/Desktop/typescript/wasm/radix_engine_toolkit.wasm");
    let manifestString = toolkit.manifestStringFromCompiledIntent(buffer_1.Buffer.from(rawHex, "hex"));
    console.log(manifestString);
});
main();
