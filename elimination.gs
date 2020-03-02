
class BracketWriter {
  constructor(sheet){
    this.sheet = sheet;
    this.gameRange = sheet.getRange('games');
    this.gameLength = 6;
    this.gameHeight = 1;
    this.gameColumnWidths = [50, 80, 20, 20, 80, 10];
    this.formatRules = []
    this.backgroundColor = '#CFE2F3';
    this.gameColor = '#F4CCCC';
  }
  
  drawGame(game, gamePos, gameRow, drawOptions={}){
    game.drawPos = gamePos;
    drawOptions = this.getDefaults(drawOptions);
    var cRange = this.sheet.getRange(gamePos[0], gamePos[1],1,5);
    cRange.setFormulas([[`=CONCATENATE("Game #"; B${gameRow})`,
                         `=C${gameRow}`,
                         `=IF(ISBLANK(E${gameRow}); "-";E${gameRow})`,
                         `=IF(ISBLANK(F${gameRow}); "-";F${gameRow})`,
                         `=D${gameRow}`]]);
    cRange.setBackground(drawOptions.gameColor)
    .setBorder(true, true, true, true, false, false)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setFontWeight('normal')
    .setWrap(true)
    .offset(0, 0,1,1).setFontWeight('bold');
    this.addGameFormatting(cRange);
  }
  
  getDefaults(drawOptions={}){
    return {bgColor:this.backgroundColor, gameColor:this.gameColor};
  }
  
  drawCanvas(start, height, length, drawOptions={}){
    
    drawOptions = this.getDefaults(drawOptions);
    var canvas  = this.sheet.getRange(start[0], start[1]-1, height+1, length+1);
    canvas.clear()
    .setBackground(drawOptions.bgColor)
    .setBorder(true, true, true, true, false, false);
    for (let r=0; r < length; r+=this.gameLength) { // make widths nice
       this.gameColumnWidths.forEach( (l, i) => this.sheet.setColumnWidth(start[1] + i + r, l));  
    }
    return canvas;
  }
  
  getGameRow(game){
    return this.gameRange.getRow()+game.gameNumber-1;
  }
  
  connect(gameStart, gameEnd){
    // connect start of gameStart to end of gameEnd
    let col = gameStart.drawPos[1]-1;
    let rows = [gameStart.drawPos[0], gameEnd.drawPos[0]].sort((x,y)=>x-y);
    let cRange = this.sheet.getRange(rows[0], col, rows[1]-rows[0]+1, 1);
    cRange.setBackground('black');
  }
  
  connectGames(games){
    for (let game of games) {
      for (let seed of game.seeds) {
         if (games.indexOf(seed) > -1) {
           this.connect(game, seed);
         }
      }
    }
  }
  
  drawGames(games, start, drawOptions){
    // work out dimensions;
    let rows = games.map(g=>g.pos[0]).sort((x,y)=>x-y); let maxR=last(rows), minR=rows[0];
    let cols = games.map(g=>g.pos[1]).sort((x,y)=>x-y); let maxC=last(cols), minC=cols[0];
    let width = this.gameLength*(maxC-minC+1), height = this.gameHeight*(maxR-minR+1); 
    
    // set up. background.
    this.drawCanvas(start, height, width, drawOptions)
    
    games.forEach( game => {
       let row = start[0] + this.gameHeight*(game.pos[0]  - minR);
       let col = start[1]  + this.gameLength*(game.pos[1] - minC);
       let drawPos = [row, col];
       this.drawGame(game, drawPos, this.getGameRow(game), drawOptions);
    });
    this.connectGames(games);
    return [height, width];
  }
  
  getScoreFormatRule(range) {
    var rules = [];
    var formula = ("=GT(" + range.offset(1, 1,1,1).getA1Notation() + "; " + range.offset(2, 1,1,1).getA1Notation() + ")");
    rules.push(SpreadsheetApp.newConditionalFormatRule()
               .whenFormulaSatisfied(formula)
               .setBold(true)
               .setRanges([range.offset(1, 0,1,2)])
               .build());
    
    rules.push(SpreadsheetApp.newConditionalFormatRule()
               .whenFormulaSatisfied(formula)
               .setStrikethrough(true)
               .setRanges([range.offset(2, 0,1,2)])
               .build());
    
    formula = ("=LT(" + range.offset(1, 1,1,1).getA1Notation() + "; " + range.offset(2, 1,1,1).getA1Notation() + ")");
    rules.push(SpreadsheetApp.newConditionalFormatRule()
               .whenFormulaSatisfied(formula)
               .setBold(true)
               .setRanges([range.offset(2, 0,1,2)])
               .build());
    
    rules.push(SpreadsheetApp.newConditionalFormatRule()
               .whenFormulaSatisfied(formula)
               .setStrikethrough(true)
               .setRanges([range.offset(1, 0,1,2)])
               .build());
    return rules;
  }
  
  addGameFormatting(cell){
    this.formatRules.push(this.getScoreFormatRule(cell));
  }
  
  recDraw(games, game, center, rShift=0){
    game.pos = center;
    
    var cell = this.sheet.getRange(center[0], center[1]);
    this.drawGame(game, cell, this.gameRange.getRow()+game.gameNumber-1);
        
    if (games.indexOf(game.seeds[0]) > -1) {
      let shift = Math.pow(2, game.seeds[0].r-2+rShift);
      this.recDraw(games, game.seeds[0], [center[0] - shift, center[1]-6], rShift);
      cell.offset(-shift,-1,shift+1,1).setBackground('black'); //  connect
    }
    if (games.indexOf(game.seeds[1]) > -1) {
      let shift = Math.pow(2, game.seeds[1].r-2+rShift);
      this.recDraw(games, game.seeds[1], [center[0] + shift, center[1]-6], rShift);
      cell.offset(0,-1,shift+1,1).setBackground('black');  //  connect
    }
  }
  
}

class EliminationBracket extends Bracket {
 constructor(sheet) {
   super(sheet);
   this.numTeams = sheet.getRange('numTeams').getValue();
   
 }
  
  writeBracket(){
    var teams = this.sheet.getRange('teams').offset(0,0,this.numTeams,1).getValues().flat();
    var games = this.eliminationGames(teams.length); 
    var final = last(games);
    nameTeam(final, teams);
    this.drawElim(games);
    this.writeGames(games)
  }
  
  writeGames(games){
    
    // add stuff to automatically shift games once scores are entered.
    var teamsRow0 = this.sheet.getRange('teams').getRow();
    var gamesRow0 = this.sheet.getRange('games').getRow();
    var sheet =this.sheet;
    
    var teamFn = function (game){
      let teams  = [null, null];
      
      game.seeds.forEach(function (seed, i) {
        if (seed==null){null;}
        else if (seed > 0) { teams[i] = "=B$" + (teamsRow0+seed-1).toString();}
        else {
          let seedRow = gamesRow0+seed.gameNumber-1;
          if (game.winner[i]) {teams[i] = `=IF(E${seedRow}>F${seedRow};C${seedRow};IF(E${seedRow}<F${seedRow};D${seedRow};"Winner ${seed.gameNumber}"))`;}
          else {teams[i] = `=IF(E${seedRow}<F${seedRow};C${seedRow};IF(E${seedRow}>F${seedRow};D${seedRow};"Loser ${seed.gameNumber}"))`;}
         }
      });
      return teams;
    }
       
    var rowFormulasFn = function (game){
      let tNames = teamFn(game);
      return [`=${game.r}`, `=${game.gameNumber}`, tNames[0], tNames[1], null, null];
    }
    var gameRange = this.sheet.getRange('games');
    gameRange.offset(0,0,games.length,6).setFormulas(games.map(g=>rowFormulasFn(g)));
  }
  
  writeBracBrackets(){
    var teams = this.sheet.getRange('teams').offset(0,0,this.numTeams,1).getValues().flat();
    
    var numTeams = 16;
    var brackets = [{teamsIn:5,teamsOut:2}, {teamsIn:7, teamsOut:2},{teamsIn:4, double:false}];
    
    var games = bracEliminationGames(brackets);

    var final = last(last(games));
    console.log(final);
    nameTeam(final, teams);
    brackets.forEach( (b, i) => b.games = games[i]);
    
    this.drawBracElim(brackets);
    // write games into sheet
    var gameRange = this.sheet.getRange('games');
    games = games.flat();
    gameRange.offset(0,0,games.length,6).setValues(games.map(g=>[g.r, g.gameNumber, g.teams[0], g.teams[1], g.score1,g.score2]));
  }
  
  gameFromRow(row) {
    const [round, gameNumber, team1, team2, score1, score2, bracketName=null] = row;
    return {round:round, gameNumber:gameNumber, team1:team1, score1:score1, bracketName:bracketName};
  }
 
  getCellPositionsRec(games, game, center, rShift=0){
    game.pos = center;
    let seedsIn = game.seeds.filter(s=> games.indexOf(s) >-1);
    let offset = seedsIn.length == 2 ? 1 : 0;
    seedsIn.forEach( (seed, i) => {
      let shift = Math.pow(2, Math.floor(seed.r-2+rShift))*offset*(2*i-1);
      this.getCellPositionsRec(games, seed, [center[0] + shift, center[1]-1], rShift); 
    });
  }

  drawSingleElim(games, start=[4,8], options={}){
    const rounds = getAsRounds(games);
    
    const startRound = Math.min(...games.map(g=>g.r));
    const endRound = Math.max(...games.map(g=>g.r));
    const numRounds = endRound-startRound+1;
   
    const rShift = (games.filter(x=>x.r==1).length > games.filter(x=>x.r==2).length) ? 1 : 0;
    const maxHeight = 2 * Math.pow(2, numRounds-2+rShift);
    const length = 6 * (numRounds);
       
    var gameRange = this.sheet.getRange('games');
    
    var final = last(games);
    const finalCenter = [Math.ceil(maxHeight/(2)), 0];
    this.getCellPositionsRec(games, final, finalCenter, rShift);
    
    var bw = new BracketWriter(this.sheet);
    //bw.drawCanvas(start, maxHeight, length);
    return bw.drawGames(games, start);

  }
  
  drawDoubleElim(games, start=[4,8], options={}){
    
    const wbGames = games.filter(g=>g.WB);
    const lbGames = games.filter(g=>!g.WB);    

    let [wRow, wCol] = this.drawSingleElim(wbGames, start, options);
    this.drawSingleElim(lbGames,[wRow+10, start[1]], options);

   
  }
  
  drawBracElim(brackets, start=[4,8], bgColor=backgroundColor){

    for (var bracket of brackets){
      if (!bracket.double) {
         this.drawSingleElim(bracket.games, start);
         start = [ start[0], last(bracket.games).pos[1]+6];
      }
    }
  }
  
}

class SingleEliminationBracket extends EliminationBracket {
 constructor(sheet) {
   super(sheet);
 }
  
  eliminationGames(numTeams){return singleEliminationGames(numTeams);};
  
  drawElim(games){return this.drawSingleElim(games);};
 
}

class doubleEliminationBracket extends EliminationBracket {
 constructor(sheet, doubleFinal=false) {
   super(sheet);
   this.doubleFinal=doubleFinal;
 }
   
  eliminationGames(numTeams) {
    let games = doubleEliminationGames(numTeams);
    if (this.doubleFinal) {
      let final = last(games);
      games.push({gameNumber:final.gameNumber+1, seeds:[final, null], teams:final.teams,r:final.r+1,
                  name:'final2', WB:true, title:'Second Final (if needed)'});
    }
    return games};
  
  drawElim(games){return this.drawDoubleElim(games);};
  
}

function makeSingleElim () {
  const selB = new SingleEliminationBracket(SpreadsheetApp.getActiveSheet());
  selB.writeBracket();
  return selB;
}

function makeDoubleElim () {
  const selB = new doubleEliminationBracket(SpreadsheetApp.getActiveSheet(),true);
  selB.writeBracket();
  return selB;
}

function makeBrackElim () {
  const selB = new EliminationBracket(SpreadsheetApp.getActiveSheet());
  selB.writeBracBrackets();
  return selB;
}

function nameTeam(game, teamNames) {
  var teams = [null,null]; game.teams=teams;
  var winner = [null, null];game.winner=winner;
  
  game.seeds.filter(s=>s).forEach(function (s, i) {
    if (s>0){ teams[i]=teamNames[s-1];}
    else {
      var wl=true;
      if (!game.WB && s.WB) {wl = false;} else {nameTeam(s, teamNames); }
      teams[i] = (wl ? 'Winner #' : 'Loser #') + s.gameNumber.toString();
      winner[i]=wl;
    }                        
  });
}

function drawLine(start, end, sheet){
  var range = null;
  return range;
}

function singleEliminationGames(numTeams) {

  // find power of two >= team number
  const numRounds = Math.ceil(Math.log2(numTeams));

  // work backwards, rounds and games. 
  var gameNumber = numTeams-1;
  var final = {r:numRounds, gameNumber:gameNumber, seeds:[1,2]}; 
  gameNumber--;
  var allGames = [final];
  var thisRound = [final];
  for (r = 2; r <= numRounds; r++){

    let lastRound = thisRound; thisRound = [];
    for (const g of lastRound) {
      for (const s of [1,0]) { 
        const t2 = Math.pow(2,r)+1-g.seeds[s];
          if (t2 <= numTeams) {
            var newGame = {r:numRounds-r+1, gameNumber:gameNumber, seeds:[g.seeds[s], t2]};
            gameNumber--; 
            g.seeds[s]=newGame; 
            allGames.push(newGame); 
            thisRound.push(newGame);
        }
      }    
    }
  }
  return allGames.reverse();
}

function getWinner(game){
   if (game==null) {return null;}
   else if (game.seeds[0] == null && game.seeds[1]==null) {return null;}
   else if(game.seeds[0] == null) {return game.seeds[1];}
   else if(game.seeds[1] == null) {return game.seeds[0];}
   else {return game;}
}

function getAsRounds(games){
  var maxRounds = Math.max(...games.map(g=> g.r));
  var rounds = []; for (var i=0; i<maxRounds; i++) {rounds.push(games.filter(g=>g.r==i+1));}
  return rounds;
}

function doubleEliminationGames(numTeams) {
  
  // do again for power of 2, then trim games.
  const nTeams2 = ceilLog2(numTeams);
  var wB = getAsRounds(singleEliminationGames(nTeams2));
  flat(wB).forEach(g=> {g.WB=true;});
  var numRounds = wB.length+1;
  
  var round = 1;
  // initial lb Round
  var lB0 = [];
  for (let i=0;i<nTeams2/2;i+=2){
    seeds = [0,1].map(s => {
      
      let t = wB[0][i+s];
      if (t.seeds[1]>numTeams) {
        let feedGame = wB[1][Math.floor(i/2)];
        feedGame.seeds[s] = t.seeds[0];
        wB[0][i+s] = null;
        return null;
      } else { return t;};
      });

    let gn = nTeams2/2+(i+1)/(2*nTeams2 + 1)
    let g = {r: round, gameNumber:gn, seeds:seeds, WB:false, major:false};
    lB0.push(g);
  }
  var lB = [lB0];

  for (var r=1; r<wB.length; r++) {
    var wRound = wB[r];
    round = r+1;
    var nGames = wRound.length;
    var gn = wRound[wRound.length-1].gameNumber;
    var lbRound = [];

    // major games
    for (var g=0;g<nGames;g++){
      let wGame = wRound[g];
      gn+= 1/(2*nGames+1); // will use this to put the games in order later.
      
      var s2Game = getWinner(lB[r-1][lB[r-1].length-1-g]); // get minor round winners from last  round.
      let lBGame = {r: round, gameNumber:gn, seeds:[wGame, s2Game], WB:false, major:true};
      lbRound.push(lBGame);
    }

    // minor games
    nGames = lbRound.length;
    for (var g=0;g<nGames-1;g+=2){
      gn+= 1/(2*nGames+1);
      let s1 = getWinner(lbRound[g]), s2 = getWinner(lbRound[g+1]);
      let lBGame = {r: round, gameNumber:gn, seeds:[s1, s2], WB:false, major:false};
      lbRound.push(lBGame);
    }
    lB.push(lbRound);
  }
  
  let final = {r:numRounds, major: false, WB:true,
                seeds:[last(last(wB)), last(last(lB))],
               name:'final', text:'Final!',gameNumber:2*numTeams};
  
  let allGames = [final, ...flat(wB), ...flat(lB)].filter(g=>g)
    .filter(g=>(g.seeds.indexOf(null)==-1)) // get rid of games we don't plat
    .sort((x,y) => x.gameNumber - y.gameNumber);  // put into order
  allGames.forEach((g,i) => g.gameNumber=i+1); // set Game numbers
  return allGames; 
}

function bracEliminationGames(format){
  // format is list of brackets {teamsIn: n, teamsOut: m, double:False}
  let brackets = [];
  let lastBracketGames = [];
  let lastGameNumber = 0;
  let teamsLeft = format.map(g=>g.teamsIn).reduce((a,b)=>a+b);
  for (b=0;b<format.length;b++) {
    const {teamsIn, teamsOut=1, double=false} = format[b];
    let numTeams = teamsIn + lastBracketGames.length;
    let games = (double ? doubleEliminationGames : singleEliminationGames)(numTeams);
    games = games.slice(0,games.length-teamsOut+1);
    // add games from last bracket
  
    for (game of games){
      game.gameNumber+=lastGameNumber; 
      game.bracket=b+1;
      for (s of [0,1]) { 
        if(game.seeds[s]>teamsIn) {
          game.seeds[s] = lastBracketGames[game.seeds[s]-teamsIn-1];}
        else if (game.seeds[s] <= teamsIn) {game.seeds[s] += teamsLeft-teamsIn;};
      }
    }
    lastBracketGames = games.slice(games.length-teamsOut, games.length);
    lastGameNumber = last(games).gameNumber;
    teamsLeft -= teamsIn;
    brackets.push(games);
  }
  return brackets;
}