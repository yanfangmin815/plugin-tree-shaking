function test() {
  try {} catch (err) {} finally {}
}

function testUseful() {
  try {
    console.log('this function is usefull...');
  } catch (err) {
    console.log("err is:" + err);
  } finally {
    console.log("exec finally");
  }
}

function testUsefulNew() {
  console.log('this function is usefull...');
}

let AAA = '1232434',
    RRR = '4567';
const BBB = '4567';

const CCC = () => {};

const DDD = function () {};

export { test, testUseful };