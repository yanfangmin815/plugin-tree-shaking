'this is no-empty file...';

import { testUseful } from './sub-constant';
import { testUsefulVice } from './sub-constant/vice-index';

function AA() {
  try {
    testUseful();
    testUsefulVice();
  } catch (err) {
    console.log("err is:" + err);
  } finally {
    console.log("exec finally");
  }
}

AA();