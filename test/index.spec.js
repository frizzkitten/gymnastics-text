const expect = require('chai').expect;
const index = require('../index');

it('Correctly chooses people', function () {
    type = "";
    message = "whos going";
    expected = "people";
    output = index.parseMessage(message, type);
    expect(output).equals(expected);
});