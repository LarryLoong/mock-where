const MockServer = require('./MockServer');
const InternalError = require('qnode-error').InternalError;
const Beans = require('qnode-beans');

module.exports = class MockServerManager {

    constructor() {
        this._allByPort = {};
    }

    init() {
        this._loadMockServers();
    }

    resolveProviderClassName(name, cfg) {
        let type;
        if (cfg && cfg.type) {
            type = cfg.type;
        } else {
            type = name || 'dir';
        }
        return `MockConfigProvider_${type}`;
    }

    resolveProviderClass(className) {
        try {
            /* eslint global-require: "off" */
            return require(`./provider/${className}`);
        } catch (e) {
            this._logger.error(e);
            throw new Error(`failed to load provider: ${className}`);
        }
    }

    _buildProvider(name, providerConfig) {
        const className = this.resolveProviderClassName(name, providerConfig);
        const clazz = this.resolveProviderClass(className);
        const r = new clazz(providerConfig);
        this._beans.renderThenInitBean(r, className);
        return r;
    }

    _resolveDefaultProviders() {
        return {
            dir: {
                type: 'dir'
            },
            empty: {}
        };
    }

    _buildProviders() {
        const providerConfigs = this._config.providers = this._config.providers || this._resolveDefaultProviders();

        const r = [];
        for (let name in providerConfigs) {
            const providerConfig = providerConfigs[name];
            r.push(this._buildProvider(name, providerConfig));
        }
        return r;
    }

    _loadMockServers() {
        const providers = this._buildProviders();
        providers.forEach(provider => this._loadMockServerWithProvider(provider));
    }

    _loadMockServerWithProvider(provider) {
        const vhostsConfigByPort = provider.load();
        const allByPort = this._allByPort;

        for (let port in vhostsConfigByPort) {
            if (allByPort[port]) throw new Error(`duplicated mocker server port: ${port}`);

            const vhostsConfig = vhostsConfigByPort[port];
            const mockServer = this._create(vhostsConfig);
            allByPort[port] = mockServer;
        }
    }

    start() {
        const log = this._logger;
        log.info('starting mock servers');

        const allByPort = this._allByPort;
        for (let port in allByPort) {
            log.debug('starting mock server on port: %i', port);

            allByPort[port].start();

            log.debug('created mock server on port: %i', port);
        }
        log.info('started mock servers\n');
    }

    _create(serverConfig) {
        this._logger.debug('creating mock server on port: %i', serverConfig.port);

        const r = new MockServer(serverConfig);
        this._beans.renderThenInitBean(r);

        this._logger.debug('created mock server on port: %i', serverConfig.port);

        return r;
    }

    get(port) {
        return this._allByPort[port];
    }

}