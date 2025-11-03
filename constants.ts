
export const metroData = {
    stations: [
         // Line 1: Blue - Coordinates Audited
         { id: 'vsv', name: 'Versova', line: 'blue', lat: 19.1213, lon: 72.8175 },
         { id: 'dnn', name: 'D.N. Nagar', line: 'blue', lat: 19.1200, lon: 72.8270, interchange: true },
         { id: 'azn', name: 'Azad Nagar', line: 'blue', lat: 19.1215, lon: 72.8330 },
         { id: 'and', name: 'Andheri', line: 'blue', lat: 19.1195, lon: 72.8435, interchange: true },
         { id: 'weh', name: 'W.E.H.', line: 'blue', lat: 19.1158, lon: 72.8530, interchange: true },
         { id: 'cha', name: 'Chakala (J.B. Nagar)', line: 'blue', lat: 19.1100, lon: 72.8590 },
         { id: 'air', name: 'Airport Road', line: 'blue', lat: 19.1055, lon: 72.8645 },
         { id: 'mar', name: 'Marol Naka', line: 'blue', lat: 19.1040, lon: 72.8730, interchange: true },
         { id: 'sak', name: 'Saki Naka', line: 'blue', lat: 19.0915, lon: 72.8830 },
         { id: 'asa', name: 'Asalpha', line: 'blue', lat: 19.0850, lon: 72.8880 },
         { id: 'jag', name: 'Jagruti Nagar', line: 'blue', lat: 19.0780, lon: 72.8980 },
         { id: 'ght', name: 'Ghatkopar', line: 'blue', lat: 19.0740, lon: 72.9040, interchange: true },

         // Line 2A: Yellow - Coordinates Audited
         { id: 'dah', name: 'Dahisar (East)', line: 'yellow', lat: 19.2510, lon: 72.8645, interchange: true },
         { id: 'y-an', name: 'Anand Nagar', line: 'yellow', lat: 19.2455, lon: 72.8597 },
         { id: 'y-ka', name: 'Kandarpada', line: 'yellow', lat: 19.2393, lon: 72.8549 },
         { id: 'y-ma', name: 'Mandapeshwar', line: 'yellow', lat: 19.2340, lon: 72.8502 },
         { id: 'y-ek', name: 'Eksar', line: 'yellow', lat: 19.2278, lon: 72.8465 },
         { id: 'y-bo', name: 'Borivali (West)', line: 'yellow', lat: 19.2230, lon: 72.8440 },
         { id: 'y-pe', name: 'Pahadi Eksar', line: 'yellow', lat: 19.2162, lon: 72.8420 },
         { id: 'y-da', name: 'Dahanukarwadi', line: 'yellow', lat: 19.2085, lon: 72.8410 },
         { id: 'y-va', name: 'Valnai', line: 'yellow', lat: 19.1995, lon: 72.8390 },
         { id: 'y-ml', name: 'Malad (West)', line: 'yellow', lat: 19.1918, lon: 72.8375 },
         { id: 'y-lm', name: 'Lower Malad', line: 'yellow', lat: 19.1845, lon: 72.8360 },
         { id: 'y-kp', name: 'Kasturi Park', line: 'yellow', lat: 19.1770, lon: 72.8345 },
         { id: 'y-bn', name: 'Bangur Nagar', line: 'yellow', lat: 19.1680, lon: 72.8325 },
         { id: 'y-go', name: 'Goregaon (West)', line: 'yellow', lat: 19.1610, lon: 72.8310 },
         { id: 'y-os', name: 'Oshiwara', line: 'yellow', lat: 19.1480, lon: 72.8290 },
         { id: 'y-lo', name: 'Lower Oshiwara', line: 'yellow', lat: 19.1400, lon: 72.8280 },
         { id: 'y-aw', name: 'Andheri (West)', line: 'yellow', lat: 19.1310, lon: 72.8275 },
         { id: 'dnn-y', name: 'D.N. Nagar', line: 'yellow', lat: 19.1200, lon: 72.8270, interchange: true }, 

         // Line 7: Red - Coordinates Audited
         { id: 'dah-r', name: 'Dahisar (East)', line: 'red', lat: 19.2510, lon: 72.8645, interchange: true }, 
         { id: 'ovp-r', name: 'Ovaripada', line: 'red', lat: 19.2430, lon: 72.8615 },
         { id: 'ras-r', name: 'Rashtriya Udyan', line: 'red', lat: 19.2360, lon: 72.8630 },
         { id: 'dev-r', name: 'Devipada', line: 'red', lat: 19.2290, lon: 72.8640 },
         { id: 'mag-r', name: 'Magathane', line: 'red', lat: 19.2220, lon: 72.8650 },
         { id: 'poi-r', name: 'Poisar', line: 'red', lat: 19.2130, lon: 72.8660 },
         { id: 'aku-r', name: 'Akurli', line: 'red', lat: 19.2040, lon: 72.8670 },
         { id: 'kur-r', name: 'Kurar', line: 'red', lat: 19.1950, lon: 72.8680 },
         { id: 'din-r', name: 'Dindoshi', line: 'red', lat: 19.1770, lon: 72.8700 },
         { id: 'aar-r', name: 'Aarey', line: 'red', lat: 19.1640, lon: 72.8710 },
         { id: 'jog-r', name: 'Jogeshwari (E)', line: 'red', lat: 19.1430, lon: 72.8660 },
         { id: 'mog-r', name: 'Mogra', line: 'red', lat: 19.1310, lon: 72.8610 },
         { id: 'gun', name: 'Gundavali', line: 'red', lat: 19.1159, lon: 72.8535, interchange: true }, 

         // Line 3: Aqua - Coordinates Audited and Corrected
         { id: 'aar', name: 'Aarey', line: 'aqua', lat: 19.1411, lon: 72.8710 },
         { id: 'see', name: 'SEEPZ', line: 'aqua', lat: 19.1290, lon: 72.8768 },
         { id: 'mid', name: 'MIDC', line: 'aqua', lat: 19.1215, lon: 72.8805 },
         { id: 'mar-a', name: 'Marol Naka', line: 'aqua', lat: 19.1082, lon: 72.8837, interchange: true },
         { id: 'csm-t2', name: 'CSMIA T2', line: 'aqua', lat: 19.1002, lon: 72.8745 },
         { id: 'sah', name: 'Sahar Airport', line: 'aqua', lat: 19.0985, lon: 72.8620 },
         { id: 'csm-t1', name: 'CSMIA T1', line: 'aqua', lat: 19.0910, lon: 72.8655 }, 
         { id: 'san', name: 'Santacruz', line: 'aqua', lat: 19.0830, lon: 72.8590 },
         { id: 'bkc', name: 'BKC', line: 'aqua', lat: 19.0665, lon: 72.8625 }, 
         { id: 'dha', name: 'Dharavi', line: 'aqua', lat: 19.0520, lon: 72.8580 }, 
         { id: 'dad', name: 'Dadar', line: 'aqua', lat: 19.0220, lon: 72.8445, interchange: true }, 
         { id: 'sid', name: 'Siddhivinayak', line: 'aqua', lat: 19.0275, lon: 72.8442 }, 
         { id: 'wor', name: 'Worli', line: 'aqua', lat: 19.0170, lon: 72.8290 }, 
         { id: 'sci', name: 'Science Museum', line: 'aqua', lat: 19.0060, lon: 72.8190 },
         { id: 'mct', name: 'Mumbai Central', line: 'aqua', lat: 18.9730, lon: 72.8190, interchange: true },
         { id: 'kal', name: 'Kalbadevi', line: 'aqua', lat: 18.9480, lon: 72.8270 },
         { id: 'cst', name: 'CST Metro', line: 'aqua', lat: 18.9400, lon: 72.8340, interchange: true },
         { id: 'chu', name: 'Churchgate', line: 'aqua', lat: 18.9330, lon: 72.8280, interchange: true },
         { id: 'cuf', name: 'Cuffe Parade', line: 'aqua', lat: 18.9130, lon: 72.8170 },
     ],
      connections: [
          // Line 1: Blue
          ['vsv', 'dnn'], ['dnn', 'azn'], ['azn', 'and'], ['and', 'weh'], ['weh', 'cha'],
          ['cha', 'air'], ['air', 'mar'], ['mar', 'sak'], ['sak', 'asa'], ['asa', 'jag'],
          ['jag', 'ght'],

          // Line 2A: Yellow
          ['dah', 'y-an'], ['y-an', 'y-ka'], ['y-ka', 'y-ma'], ['y-ma', 'y-ek'], ['y-ek', 'y-bo'],
          ['y-bo', 'y-pe'], ['y-pe', 'y-da'], ['y-da', 'y-va'], ['y-va', 'y-ml'], ['y-ml', 'y-lm'],
          ['y-lm', 'y-kp'], ['y-kp', 'y-bn'], ['y-bn', 'y-go'], ['y-go', 'y-os'], ['y-os', 'y-lo'],
          ['y-lo', 'y-aw'], ['y-aw', 'dnn-y'],

          // Line 7: Red
          ['dah-r', 'ovp-r'], ['ovp-r', 'ras-r'], ['ras-r', 'dev-r'], ['dev-r', 'mag-r'], ['mag-r', 'poi-r'],
          ['poi-r', 'aku-r'], ['aku-r', 'kur-r'], ['kur-r', 'din-r'], ['din-r', 'aar-r'], ['aar-r', 'jog-r'],
          ['jog-r', 'mog-r'], ['mog-r', 'gun'],

          // Line 3: Aqua
          ['aar', 'see'], ['see', 'mid'], ['mid', 'mar-a'], ['mar-a', 'csm-t2'], ['csm-t2', 'sah'],
          ['sah', 'csm-t1'], ['csm-t1', 'san'], ['san', 'bkc'], ['bkc', 'dha'], ['dha', 'dad'],
          ['dad', 'sid'], ['sid', 'wor'], ['wor', 'sci'], ['sci', 'mct'], ['mct', 'kal'],
          ['kal', 'cst'], ['cst', 'chu'], ['chu', 'cuf'],

          // --- Interchanges (Physical Connections) ---
          ['dnn', 'dnn-y'], // Blue <-> Yellow at D.N. Nagar
          ['dah', 'dah-r'], // Yellow <-> Red at Dahisar (East)
          ['weh', 'gun'],   // Blue <-> Red at W.E.H./Gundavali
          ['mar', 'mar-a']  // Blue <-> Aqua at Marol Naka
      ]
};
