const { test } = require('tap');
const fs = require('fs').promises;
const { join } = require('path');
const os = require('os');
const configStore = require('../../lib/helpers/config-store');
const EikConfig = require('../../lib/classes/eik-config');

function mkdirTempDir() {
    return fs.mkdtemp(join(os.tmpdir(), 'eik-config'));
}

test('loads from package.json', (t) => {
    const config = configStore.findInDirectory('pizza dir', (path) => {
        if (path.includes('eik.json') || path.includes('.eikrc')) return null;
        t.match(path, 'pizza dir/package.json');
        return {
            name: 'magarita',
            version: 'tomato',
            notIncluded: 'fish',
            eik: {
                'import-map': 'deep dish',
            },
        };
    });
    t.equal(config.name, 'magarita');
    t.equal(config.version, 'tomato');
    t.equal(config.notIncluded, undefined);
    t.deepEqual(config.map, ['deep dish']);
    t.end();
});

test('loads from eik.json', (t) => {
    const config = configStore.findInDirectory('pizza dir', (path) => {
        if (path.includes('package.json') || path.includes('.eikrc'))
            return null;
        t.match(path, 'pizza dir/eik.json');
        return {
            name: 'magarita',
        };
    });
    t.equal(config.name, 'magarita');
    t.end();
});

test('package.json and eik.json not being present', (t) => {
    t.plan(1);
    try {
        configStore.findInDirectory('pizza dir', () => null);
    } catch (e) {
        t.equal(
            e.message,
            "No package.json or eik.json file found in: 'pizza dir'",
        );
    }
    t.end();
});

test('package.json and eik.json both have eik config', (t) => {
    t.plan(1);
    const jsonReaderStub = (path) => {
        if (path.includes('package.json'))
            return { eik: { pizza: 'magarita' } };
        return {};
    };
    try {
        configStore.findInDirectory('pizza dir', jsonReaderStub);
    } catch (e) {
        t.equal(
            e.message,
            'Eik configuration was defined in both in package.json and eik.json. You must specify one or the other.',
        );
    }

    t.end();
});

test('name is pulled from package.json if not defined in eik.json', (t) => {
    const jsonReaderStub = (path) => {
        if (path.includes('package.json')) return { name: 'big pizza co' };
        if (path.includes('eik.json')) return { version: 'bigger and better' };
        return {};
    };
    const config = configStore.findInDirectory('pizza dir', jsonReaderStub);
    t.equal(config.name, 'big pizza co');
    t.equal(config.version, 'bigger and better');
    t.equal(config.version, 'bigger and better');
    t.end();
});

test('tokens are present', (t) => {
    const config = configStore.findInDirectory('pizza dir', (path) => {
        if (path.includes('.eikrc')) return { tokens: [['bakery', 'muffins']] };
        return {};
    });
    t.equal(config.server, 'bakery');
    t.equal(config.token, 'muffins');
    t.end();
});

test('invalid json error', (t) => {
    t.plan(1);
    const jsonReaderStub = (path) => {
        if (path.includes('.json')) JSON.parse('not json');
        return {};
    };

    try {
        configStore.findInDirectory('pizza dir', jsonReaderStub);
    } catch (e) {
        t.equal(e.message, 'Unexpected token o in JSON at position 1');
    }
    t.end();
});

test('no configuration present', (t) => {
    t.plan(1);
    try {
        configStore.findInDirectory('pizza dir', () => {});
    } catch (e) {
        t.equal(
            e.message,
            "No package.json or eik.json file found in: 'pizza dir'",
        );
    }
    t.end();
});

test('reading without stubbed json', (t) => {
    const config = configStore.findInDirectory(__dirname);
    t.equal(config.name, 'my-app');
    t.end();
});

test('saves config to disk', async (t) => {
    const path = await mkdirTempDir();
    const config = new EikConfig({ out: 'muffins' }, null, path);

    configStore.persistToDisk(config);

    const persistedConfig = configStore.findInDirectory(path);
    t.equal(persistedConfig.out, 'muffins');
    t.end();
});

test('handles no path being provided', async (t) => {
    t.plan(1);
    const config = new EikConfig({ out: 'muffins' });

    try {
        configStore.persistToDisk(config);
    } catch (e) {
        t.equal(
            e.message,
            'The "path" argument must be of type string. Received undefined',
        );
    }
    t.end();
});