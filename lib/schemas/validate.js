'use strict';

const semver = require('semver');
const npmPkg = require('validate-npm-package-name');

const Ajv = require('ajv');
const eikJSONSchema = require('./eikjson.schema.json');

const createValidator = (schema, ajvOptions) => {
    const ajv = new Ajv(ajvOptions);
    const validate = ajv.compile({
        $schema: 'http://json-schema.org/schema#',
        ...schema,
    });

    return data => {
        const valid = validate(data);
        return { value: data, error: !valid && validate.errors };
    };
};

const eikJSON = createValidator(eikJSONSchema, {
    removeAdditional: true,
    useDefaults: true,
});
const createNameValidator = (jsonSchemaValidator) => {
    return (value) => {
        const result = jsonSchemaValidator(value);
        if (!result.error) {
            const pkvalid = npmPkg(value);
            const errors = [];
            if (!pkvalid.validForNewPackages) {
                errors.push({
                    keyword: 'validForNewPackages',
                    dataPath: '.name',
                    schemaPath: '',
                    params: [],
                    message: 'should be valid for new packages'
                });
            }
            if (!pkvalid.validForOldPackages) {
                errors.push({
                    keyword: 'validForOldPackages',
                    dataPath: '.name',
                    schemaPath: '',
                    params: [],
                    message: 'should be valid for old packages'
                });
            }
            if (errors.length) {
                result.error = errors;
            }
        }
        return result;
    }
}
const createVersionValidator = (jsonSchemaValidator) => {
    return (value) => {
        const result = jsonSchemaValidator(value);
        if (!result.error) {
            const version = semver.valid(value);
            const errors = [];
            if (!version) {
                errors.push({
                    keyword: 'invalidSemverRange',
                    dataPath: '.version',
                    schemaPath: '',
                    params: [],
                    message: 'should be valid semver range for version'
                });
            }
            if (errors.length) {
                result.error = errors;
            }
        }
        return result;
    }
}

const name = createNameValidator(createValidator(eikJSONSchema.properties.name));
const version = createVersionValidator(createValidator(eikJSONSchema.properties.version));
const server = createValidator(eikJSONSchema.properties.server);
const files = createValidator(eikJSONSchema.properties.files);
const importMap = createValidator(eikJSONSchema.properties['import-map']);
const out = createValidator(eikJSONSchema.properties.out);

module.exports.eikJSON = eikJSON;
module.exports.name = name;
module.exports.version = version;
module.exports.server = server;
module.exports.files = files;
module.exports.importMap = importMap;
module.exports.out = out;