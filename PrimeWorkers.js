onmessage = function(event) {
    var list = [],
        fromNumber = event.data.from,
        toNumber = event.data.to;
    
    for (var i=fromNumber; i<=toNumber; i++) {
      if (i>1) list.push(i);
    }

    var maxDiv = Math.round(Math.sqrt(toNumber));
    
    var startFrom = event.data.startFrom || 0;

    for (var i=startFrom; i<list.length; i++) {
        var failed = false;

        for (var j=2; j<=maxDiv; j++) {
         if ((list[i] != j) && (list[i] % j == 0)) {
            failed = true;
         } else if ((j==maxDiv) && (failed == false)) {      
             var prime = list[i],
                 percent = Math.floor((i / list.length) * 100);

            postMessage({ prime: prime, percent: percent, isFinished: false });
         }
        }
    }
    
    postMessage({isFinished: true});
};