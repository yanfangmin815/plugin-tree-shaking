function testVice() {
  try {} catch (err) {} finally {}
}

function testUsefulVice() {
  try {
    console.log('this function is usefull...');
  } catch (err) {
    console.log("err is:" + err);
  } finally {
    console.log("exec finally");
  }
}

export { testVice, testUsefulVice };