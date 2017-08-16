/* eslint no-undef: "off" */

const SRC = '../src';
const RuleEngine = require(`${SRC}/RuleEngine`);

describe("RuleEngine test suite: ", function() {

    it("_findMatchedRule(): the rule db should be rollbacked always", function() {
        const re = new RuleEngine('test');
        const req = {
            path: '/ab',
            url: 'https://host/ab',
            charset: 'utf-8',
            protocol: 'https',
            ip: '::1'
        };

        const ruleDb = re._ruleDb;

        let rows = ruleDb.exec('select count(*) c from request');
        expect(rows[0].c).toBe(0);

        re._findMatchedRule(req);

        rows = ruleDb.exec('select count(*) c from request');
        expect(rows[0].c).toBe(0);
    });

    it("_findMatchedRule(): no matched rules from rule tree", function() {
        const re = new RuleEngine('test');
        const req = {
            path: '/ab',
            method: 'get',
            url: 'https://host/ab',
            charset: 'utf-8',
            protocol: 'https',
            ip: '::1'
        };

        const matched = re._findMatchedRule(req);
        expect(matched).toBeNull();
    });

    it("_findMatchedRule(): have matched rules from rule tree, but filtered by rule db", function() {
        const re = new RuleEngine('test');
        const req = {
            path: '/ab',
            method: 'get',
            url: 'https://host/ab',
            charset: 'utf-8',
            protocol: 'https',
            ip: '::1'
        };

        re.put({ path: '/ab', q: 'protocol="http"' });
        expect(re._ruleTree.match(req.method, req.path).length).toBe(1);

        const matched = re._findMatchedRule(req);
        expect(matched).toBeNull();
    });

    it("_findMatchedRule(): got matched rules", function() {
        const re = new RuleEngine('test');
        const req = {
            path: '/ab',
            method: 'get',
            url: 'https://host/ab',
            charset: 'utf-8',
            protocol: 'https',
            ip: '::1'
        };

        const rule = { path: '/ab', q: 'protocol="https"' };
        re.put(rule);

        const matched = re._findMatchedRule(req);
        expect(matched).toEqual(rule);
    });

});