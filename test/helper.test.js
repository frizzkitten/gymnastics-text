const expect = require('chai').expect;
const helper = require('../helper');

// https://www.codementor.io/olatundegaruba/integration-testing-supertest-mocha-chai-6zbh6sefz
it('Correctly chooses people', function () {
    type = "";
    message = "whos going";
    expected = "people";
    output = helper.parseMessage(message, type);
    expect(output).equals(expected);
});