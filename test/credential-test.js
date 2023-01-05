'use strict';
var test = require('tape'),
  credential = require('../credential.js');

test('hash', function (t) {

  var pw = credential();

  pw.hash('foo', function (err, hash) {

    t.equal(typeof hash, 'string',
      'should produce a hash string.');

    t.ok(JSON.parse(hash).hash,
      'should a json object representing the hash.');

    t.end();
  });

});

test('hash with different passwords', function (t) {

  var pw = credential();

  pw.hash('foo', function (err, fooHash) {

    pw.hash('bar', function (err, barHash) {

      t.notEqual(fooHash, barHash,
        'should produce a different hash.');

      t.end();
    });
  });
});

test('hash with same passwords', function (t) {

  var pw = credential();

  pw.hash('foo', function (err, fooHash) {

    pw.hash('foo', function (err, barHash) {

      t.notEqual(fooHash, barHash,
        'should produce a different hash.');

      t.end();
    });
  });
});

test('hash with undefined password', function (t) {

  var pw = credential();

  try {
    pw.hash(undefined, function (err) {
      t.ok(err,
        'should cause error.');
      t.end();
    });
  } catch (e) {
    t.fail('should not throw');
  }

});

test('hash with empty password', function (t) {

  var pw = credential();

  try {
    pw.hash('', function (err) {
      t.ok(err,
        'should cause error.');
      t.end();
    });
  } catch (e) {
    t.fail('should not throw');
  }

});

test('verify with right pw', function (t) {
  var pass = 'foo',
      pw = credential();

  pw.hash(pass, function (err, storedHash) {
    pw.verify(storedHash, pass, function (err, isValid) {
      t.error(err,
        'should not cause error.');

      t.ok(isValid,
        'should return true for matching password.');
      t.end();
    });
  });

});

test('verify with broken stored hash', function (t) {
  var pass = 'foo',
    storedHash = 'aoeuntkh;kbanotehudil,.prcgidax$aoesnitd,riouxbx;qjkwmoeuicgr',
    pw = credential();

  pw.verify(storedHash, pass, function (err) {

    t.ok(err,
      'should cause error.');

    t.end();
  });

});

test('verify with wrong pw', function (t) {
  var pass = 'foo',
      pw = credential();

  pw.hash(pass, function (err, storedHash) {
    pw.verify(storedHash, 'bar', function (err, isValid) {
      t.ok(!isValid,
        'should return false for matching password.');
      t.end();
    });
  });

});

test('verify with undefined password', function (t) {
  var pass = 'foo',
      pw = credential();

  pw.hash(pass, function (err, storedHash) {
    try {
      pw.verify(storedHash, undefined, function (err, isValid) {
        t.ok(!isValid,
          'should return false for matching password.');
        t.ok(err,
          'should cause error.');
        t.end();
      });
    } catch (e) {
      t.fail('should not throw');
    }
  });

});

test('verify with empty password', function (t) {
  var pass = 'foo',
      pw = credential();

  pw.hash(pass, function (err, storedHash) {
    try {
      pw.verify(storedHash, '', function (err, isValid) {
        t.ok(!isValid,
          'should return false for matching password.');
        t.ok(err,
          'should cause error.');
        t.end();
      });
    } catch (e) {
      t.fail('should not throw');
    }
  });

});

test('expired with valid hash and default expiry', function (t) {
  var pass = 'foo',
      pw = credential();

  pw.hash(pass, function (err, storedHash) {
    t.notOk(pw.expired(storedHash),
      'should return false when expiry is default.');
    t.end();
  });

});

test('expired with short expiry', function (t) {
  var pass = 'foo',
      pw = credential();

  pw.hash(pass, function (err, storedHash) {
    t.notOk(pw.expired(storedHash, 2),
      'should return false when expiry is default.');
    t.end();
  });

});

test('expired with expiry in the past', function (t) {
  var pass = 'foo',
      pw = credential();

  pw.hash(pass, function (err, storedHash) {
    t.ok(pw.expired(storedHash, -2),
      'should return true when expiry is in the future.');
    t.end();
  });

});

test('constantEquals works', function (t) {
  var ctc = require('../constantTimeCompare');
  // Ensure the comparisons work as expected
  t.ok(ctc('abc', 'abc'), 'equality');
  t.ok(ctc('', ''), 'equal empty');
  t.ok(!ctc('a', ''), 'inequal 1-char');
  t.ok(ctc('a', 'a'), 'equal 1-char');
  t.ok(!ctc('ab', 'ac'), 'inequal 2-char');
  t.ok(ctc('ab', 'ab'), 'equal 2-char');
  t.ok(!ctc('abc', 'abC'), 'inequality - difference');
  t.ok(!ctc('abc', 'abcD'), 'inequality - addition');
  t.ok(!ctc('abc', 'ab'), 'inequality - missing');
  t.end();
});

// test('constantEquals exposes no timings', function (t) {
//   var ctc = require('../constantTimeCompare'),
//       ttest = require('ttest');
//   function randomInt (low, high) {
//     return Math.floor(Math.random() * (high - low) + low);
//   }
//   function timed_compare (a, b) {
//     var start = process.hrtime();
//     ctc(a, b);
//     return process.hrtime(start)[1];
//   }

//   var iterations = parseInt(process.env.TIMING_TEST_ITERATIONS, 10) || 2500,
//       results = {diff: [], equal: [], inequal: []},
//       inputs = {
//         diff: ['abcd', 'abcdefghijklmnopqrstuvwzyz'],
//         equal: ['abcdefghijklmnopqrstuvwzyz', 'abcdefghijklmnopqrstuvwzyz'],
//         inequal: ['ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwzyz']
//       },
//       test_types = ['equal', 'inequal', 'diff'];

//   for (var i = 0; i < iterations; i++) {
//     test = test_types[randomInt(0, 3)];
//     results[test].push(timed_compare.apply(null, inputs[test]));
//   }
//   // Our confidence is 99.999% that there is no variation of 15ns over the sample.
//   var opts = {mu: 15, alpha: 0.001};
//   var de = ttest(results.diff, results.equal, opts);
//   var di = ttest(results.diff, results.inequal, opts);
//   var ei = ttest(results.equal, results.inequal, opts);
//   t.ok(de.valid(), 'ttest diff set is same as equal set');
//   t.ok(di.valid(), 'ttest diff set is same as inequal set');
//   t.ok(ei.valid(), 'ttest inequal set is same as equal set');
//   t.end();
// });

test('overrides', function (t) {
  var work = 0.5;
  var keyLength = 12;

  var pw = credential({
    work: work,
    keyLength: keyLength
  });

  pw.hash('foo', function (err, hash) {

    t.equal(JSON.parse(hash).iterations, pw.iterations(work),
      'should allow workUnits override');

    t.equal(JSON.parse(hash).keyLength, keyLength,
      'should allow keylength override');
    t.end();
  });
});

test('verify with right pw using promise', function (t) {
  var pass = 'foo',
      pw = credential();

  pw.hash(pass)
  .then(function (storedHash) {
    return pw.verify(storedHash, pass);
  })
  .then(function (isValid) {
    t.ok(isValid,
      'should return true for matching password.');
    t.end();
  })
  .catch(function (err) {
    t.error(err,
      'should not cause error.');
  });
});

test('date to determine number of iteration can\'t be before 2016', function (t) {
  var pw = credential();

  var originalDateNow = Date.now;
  Date.now = function () {
    return 10;
  };

  var nbIterations = pw.iterations(1);
  t.ok(nbIterations > 250000);

  Date.now = originalDateNow;
  t.end();
});
