var Balloon = {
	position: [0,0],
	height: 0,
	target: undefined,
	rise: function(){
		this.height++;
	},
	descend: function(){
		this.height--;
	},
	moveRight:function(){
		this.position[1]++;
	},
	moveLeft: function(){
		this.position[1]--;
	},
	acquireTarget: function(target){
		this.target = target;
	},
	printPosition: function(){
		console.log(this.position[0] + ',' + this.position[1]);
	},
	printHeight: function(){
		console.log(this.height);
	}
	
}

var World = {
	width:0,
	height:0,
	grid: undefined,
	
	initialize: function(width,height,withArray){
		this.width = width;
		this.height = height;
		
		this.grid = new Array(height);
		for(var i=0;i<height;i++){
			this.grid[i] = new Array(width);
		};
		for(var j=0;j<height;j++){
			for(var k=0;k<width;k++){
				this.grid[j][k] = (withArray) ? [0,0] : 0;
			}
		}
	},
	createWindMap: function(MAX_WIND){
		for(var i = 0; i<this.height; i++){
			for(var j = 0; j<this.width; j++){
				var multiplier1 = Math.random() < 0.5 ? -1 : 1;
				var multiplier2 = Math.random() < 0.5 ? -1 : 1;
				this.grid[i,j] = [multiplier1 * (Math.floor((Math.random() * MAX_WIND) + 1)),multiplier2 * (Math.floor((Math.random() * MAX_WIND) + 1))];
			}
		}
	},
	createTargetMap: function(adjacents){
		var that = this;
		adjacents.forEach(function(element){
			that.grid[element[0]][element[1]] = 1;
		})
	}
	
}

var Target = {
		position: undefined,
		balloonCoverage : undefined,
		adjacents : undefined,
		worldWidth : undefined,
		worldHeight : undefined,
		initialize: function(positionW,positionH, balloonCoverage,worldWidth,worldHeight){
			this.position = [positionW,positionH];
			this.balloonCoverage = balloonCoverage;
			this.worldWidth = worldWidth;
			this.worldHeight = worldHeight;
			this.calculateAdjacents(this.balloonCoverage);
		},
		calculateAdjacents : function(balloonCoverage){
			this.adjacents = new Array();
			for(var i=((-1)*balloonCoverage);i<balloonCoverage; i++){
				for(var j=((-1)*balloonCoverage); j<balloonCoverage; j++){
					var util = Object.create(Utilities);
					var distance = util.columnDistance(this.position[0] + i, this.position[1] + j,this.worldWidth);
					if(((i-this.position[0])^2 + distance^2) <= balloonCoverage^2){
						this.adjacents[(i + balloonCoverage)*(balloonCoverage*2) + (j + balloonCoverage)] = new Array(2);
						var pos1 = this.position[0] +i;
						
						this.adjacents[(i + balloonCoverage)*(balloonCoverage*2) + (j + balloonCoverage)] = [pos1,this.position[1] + j];
					} 
				}
			}
			
			var tempAdjacents = new Array();
			var that = this;
			
			var tempAdjacents = this.adjacents.filter(function(point){
					if(point[0] >= 0 && point[0] < that.worldHeight){
						return true;
					}
				});
			
			
			var tempAdjacents2 = tempAdjacents.map(function(point){
				if(point[1] < 0){
					return [point[0],that.worldWidth + point[1]];
				}else{
					return [point[0],point[1]];
				}
			});
			
			
			this.adjacents = tempAdjacents2;
		}
}


var DistanceRanker = {
	balloon : undefined,
	targets : undefined,
	worldHeight : undefined,
	worldWidth : undefined,
	initialize : function(baloon, targets, worldHeight,worldWidth){
		this.balloon = baloon;
		this.targets = targets;
		this.worldHeight = worldHeight;
		this.worldWidth = worldWidth;
	},
	getNearestTarget: function(){
		var rankingTable = this.getRankingTable();
		
		return rankingTable[0];
	},
	getRankingTable : function(){
		var rankingTable = new Array();		
		var that = this;
		this.targets.forEach(function(element){
			var current = that.getLowerDistance(that.balloon.position, element.target.adjacents, element.target.position);
			rankingTable.push(current);
		});
		
		rankingTable.sort(function(a,b){
			return a.distance - b.distance;
		})

		return rankingTable;
	},
	getLowerDistance: function(balloonPosition, targetPositions, originalTarget){
		var result;
		var distanceVector;
		var distance = 1000000000;
		var that = this;
		
		targetPositions.forEach(function(target){
			var distanceHeight = Math.abs(balloonPosition[0] - target[0]);
			var distanceHeightVector = target[0] - balloonPosition[0];
			
			var util = Object.create(Utilities);
			var bestWidthDistance = util.columnDistance(balloonPosition[1],target[1],that.worldWidth);
			
			if((bestWidthDistance + distanceHeight) < distance){
				distance = (Math.abs(bestWidthDistance) + Math.abs(distanceHeight));
				result = target;
				var widthVector = (util.isBestLeft(balloonPosition[1],target[1],that.worldWidth) && bestWidthDistance != 0) ? bestWidthDistance*(-1) : bestWidthDistance;
				distanceVector = [distanceHeightVector,widthVector];				
			}
		})
		
		var targetData = {
			distance: distance,
			vector : distanceVector,
			target : result,
			originalTarget: originalTarget
		}
		return targetData;
	}
}

var Utilities = {
	columnDistance : function(compareValue1,compareValue2,worldWidth){
		var distanceLeft;
		if(compareValue1 < compareValue2){
			distanceLeft = compareValue1 + (worldWidth - compareValue2);
		}else{
			distanceLeft = compareValue1 - compareValue2;
		}
		
		var distanceRight;
		var distanceRight1 = compareValue2 - compareValue1;;
		var distanceRight2 = (worldWidth - compareValue1) + compareValue2;;
		if(compareValue1 < compareValue2){
			distanceRight = compareValue2 - compareValue1;
		}else{
			distanceRight = (worldWidth - compareValue1) + compareValue2;
		}
		
		if(distanceRight < distanceLeft){
			return distanceRight;
		}
		else{
			return distanceLeft;
		}
	},
	isBestLeft : function(compareValue1, compareValue2,worldWidth){
		var distanceLeft;
		var distanceLeft1 = compareValue1 + (worldWidth - compareValue2);;
		var distanceLeft2 = compareValue1 - compareValue2;
		if(compareValue1 < compareValue2){
			distanceLeft = compareValue1 + (worldWidth - compareValue2);
		}else{
			distanceLeft = compareValue1 - compareValue2;
		}
		
		var distanceRight;
		var distanceRight1 = compareValue2 - compareValue1;
		var distanceRight2 = (worldWidth - compareValue1) + compareValue2;
		if(compareValue1 < compareValue2){
			distanceRight = compareValue2 - compareValue1;
		}else{
			distanceRight = (worldWidth - compareValue1) + compareValue2;
		}
		if(distanceRight < distanceLeft){
			return false;
		}
		else{
			return true;
		}
	}
}

var Manager = {
	nHeights : undefined,
	nBalloons : undefined,
	nTurns : undefined,
	nTargets : undefined,
	balloonCoverage : undefined,
	worldHeight: undefined,
	worldWidth : undefined,
	targets: undefined,
	balloons: undefined,
	heightCollection: undefined,
	rankedBalloons: undefined,
	MAX_WIND: 10,
	BALLOON_START_POINT : [10,10],
	initialize: function(nTurns, nBalloons, nHeights, worldHeight, worldWidth, nTargets, balloonCoverage){
		
		this.nTurns = nTurns;
		this.nHeights = nHeights;
		this.nTargets = nTargets;
		this.balloonCoverage = balloonCoverage;
		this.worldHeight = worldHeight;
		this.worldWidth = worldWidth;
				
		this.targets = new Array();
		for(var i=0; i < nTargets ; i++){
			var currentTarget = Object.create(Target);
			var randomHeight = Math.floor((Math.random() * worldHeight) + 1);
			var randomWidth = Math.floor((Math.random() * worldWidth) + 1);
			currentTarget.initialize(randomHeight,randomWidth,this.balloonCoverage,this.worldHeight, this.worldWidth);
			
			this.targets.push({
					target : currentTarget,
					taken : false,
					counted : false
			});
		}
		
		
		
		this.balloons = new Array();
		this.rankedBalloons = new Array();
		for(var i= 0; i<nBalloons;i++){
			var currentBalloon = Object.create(Balloon);
			currentBalloon.position = this.BALLOON_START_POINT;
			currentBalloon.height = 0;
			
			this.balloons.push(currentBalloon);
			
			this.rankedBalloons.push(this.rankBalloon(currentBalloon,false));
		}
		
		this.heightCollection = new Array();
		for(var i= 0; i<nHeights; i++){
			var currentWindMap = Object.create(World);
			currentWindMap.initialize(worldWidth,worldHeight,true);
			currentWindMap.createWindMap(this.MAX_WIND);
			
			this.heightCollection.push(currentWindMap);
		}
	},
	resetBalloonPositions: function(){
		for(var i= 0; i<this.rankedBalloons.length;i++){
			this.rankedBalloons[i].position = this.BALLOON_START_POINT;
		}
	},
	rankBalloon: function(balloon, onlyFree){
		var ranker = Object.create(DistanceRanker);
		if(!onlyFree){
			ranker.initialize(balloon,this.targets,this.worldHeight,this.worldWidth);
		}else{
			ranker.initialize(balloon, this.targets.filter(function(element){(element.taken) ? false : true;}),this.worldHeight,this.worldWidth);
		}
		
		return {balloon: balloon, rankTable : ranker.getRankingTable()};
	},
	assignTargets: function(isFirstTime){
		if(isFirstTime){
			for(var i=0;i<this.balloons.length;i++){
				this.rankedBalloons[i].balloon.target = this.rankedBalloons[i].rankTable[i];
			}
		}
	},
	countPoints: function(allBalloons){
		var result = 0;
		var balloonsPositions = allBalloons.map(function(b){
			return b.balloon.position;
		});
		var targetsCopy = this.targets.map(function(item){
			return JSON.parse(JSON.stringify(item));
		});
		var countedTargetCount = targetsCopy.filter(function(t){ 
			if(t.counted) 
				return true; 
			else 
				return false;
		}).length;

		for(var i=0;i<balloonsPositions.length;i++){
			for(var j=0;j<targetsCopy.length;j++){
				if(!targetsCopy[j].counted && this.isInTarget(balloonsPositions[i],targetsCopy[j])){
					result++;
					targetsCopy[j].counted = true;
				}
			}
		}
		return result;
	},
	isInAnyOtherTarget: function(currentPosition, excludedTarget){
		var validTargets = this.targets.filter(function(target){
			if(target.target.position == excludedTarget.target){
				console.log('excluded is excluded');
				return false;
			}
			else{
				return true;	
			} 
		});

		for(var i=0;i<validTargets.length;i++){
			var currAdj = validTargets[i].target.adjacents;
			var curradjFiltered = currAdj.filter(function(target){
						if(target[0] == currentPosition[0] && target[1] == currentPosition[1])
							return true;
						else
							return false;
					});
			
			if(validTargets[i].target.position[0] == currentPosition[0] && validTargets[i].target.position[1] == currentPosition[1]){
				return true;
			}
			else if(curradjFiltered.length > 0){
				return true;
			}
		}
		return false;

	},
	getOriginalTarget: function(target){
		var theRightTarget = this.targets.filter(function(t){
			if(t.target.position[0] == target.originalTarget[0] || t.target.position[1] == target.originalTarget[1]){
				return true;
			}
			else
				return false;
		});

		return theRightTarget[0];
	},
	isInTarget: function(balloon, target){
		var allGoodPositions = new Array();
		allGoodPositions = (target.target.adjacents);
		
		for(var i=0; i<allGoodPositions.length; i++){
			if(allGoodPositions[i][0] == balloon[0] && allGoodPositions[i][1] == balloon[1])
				return true;
		}
		return false;
	},
	resetCountedTargets: function(){
		var resettedTargets = this.targets.map(function(item){
			return {target: item.target,
				taken: item.taken,
				counted: false
			}
		});
		this.targets = resettedTargets;
	},
	getValidityArray: function(currentPosition,currentHeight){
		var validity = [false,false,false];
		var windArray = this.getWindArray(currentPosition,currentHeight);
		if(currentHeight != 0){
			validity[1] = this.isAValidMove(currentPosition,windArray[1]);
		}
		if(currentHeight > 1){
			validity[0] = this.isAValidMove(currentPosition,windArray[0]);
		}
		
		if(currentHeight != (this.heightCollection.length-1)){
			validity[2] = this.isAValidMove(currentPosition,windArray[2]);
		}

		return validity;
	},
	getWindArray: function(currentPosition,currentHeight){
		var upstairsWind = undefined;
		var downstairsWind = undefined;
		var currentWind = undefined;

		if(this.heightCollection[currentHeight] != undefined)
			currentWind = this.heightCollection[currentHeight].grid[currentPosition[0],currentPosition[1]];
		if(this.heightCollection[currentHeight - 1] != undefined)
			downstairsWind = this.heightCollection[currentHeight - 1].grid[currentPosition[0],currentPosition[1]];
		if(this.heightCollection[currentHeight + 1] != undefined)
			upstairsWind = this.heightCollection[currentHeight + 1].grid[currentPosition[0],currentPosition[1]];

		return [downstairsWind,currentWind,upstairsWind];
	},
	evaluateBestMove: function(currentPosition, currentHeight, target, depth, rankingCriteria,isTest){
		var result = 0;
		if(!isTest){
			console.log('balloonPosition: ' + currentPosition);
			console.log('targetPosition: ' + target.target);	
		}

		var validity = this.getValidityArray(currentPosition,currentHeight);
		var windArray = this.getWindArray(currentPosition,currentHeight);
		
		if(!isTest){
			console.log('winds: [' +windArray[0] + '|' + windArray[1] + '|' + windArray[2]+']');
			console.log('validMoves: ' +validity);	
		}
		
		var currentGain = undefined;
		var downstairsGain = undefined;
		var upstairsGain = undefined;

		var downstairsRawPoints = 0;
		var currentRawPoints = 0;
		var upstairsRawPoints = 0;
		for(var i=0;i<validity.length;i++){
			switch(i){
				case 0:
					if(validity[0] == true){
						downstairsGain = this.calculateDistanceGain(windArray[0],target,currentPosition);
						downstairsRawPoints = (downstairsGain.gain * rankingCriteria.distanceFirstMoveMultiplier) + this.forwardAnalisys(depth,downstairsGain.newPosition, currentHeight - 1,target, rankingCriteria);
						downstairsRawPoints += (this.isInTarget(downstairsGain.newPosition,this.getOriginalTarget(target))) ? rankingCriteria.scoredTargetFirstMove : 0;
						downstairsRawPoints += (this.isInAnyOtherTarget(downstairsGain.newPosition,target)) ? rankingCriteria.scoredOtherFirstMove : 0;
					}
					break;
				case 1:
					if(validity[1] != undefined && validity[1]){
						currentGain = this.calculateDistanceGain(windArray[1],target,currentPosition);

						currentRawPoints = (currentGain.gain * rankingCriteria.distanceFirstMoveMultiplier) + this.forwardAnalisys(depth,currentGain.newPosition,currentHeight,target, rankingCriteria);
						currentRawPoints += (this.isInTarget(currentGain.newPosition,this.getOriginalTarget(target))) ? rankingCriteria.scoredTargetFirstMove : 0;
						currentRawPoints += (this.isInAnyOtherTarget(currentGain.newPosition,target)) ? rankingCriteria.scoredOtherFirstMove : 0;
					}
						
					break;
				case 2:
					if(validity[2] != undefined && validity[2]){
						upstairsGain = this.calculateDistanceGain(windArray[2],target,currentPosition);
						upstairsRawPoints = (upstairsGain.gain* rankingCriteria.distanceFirstMoveMultiplier) + this.forwardAnalisys(depth,upstairsGain.newPosition,currentHeight+1,target, rankingCriteria);
						upstairsRawPoints += (this.isInTarget(upstairsGain.newPosition,this.getOriginalTarget(target))) ? rankingCriteria.scoredTargetFirstMove : 0;
						upstairsRawPoints += (this.isInAnyOtherTarget(upstairsGain.newPosition,target)) ? rankingCriteria.scoredOtherFirstMove : 0;
					}
					break;
			}
		}

		if(!isTest)
			console.log("Gain vector: ["+downstairsRawPoints+"|"+currentRawPoints+"|"+upstairsRawPoints+"]");

		var bestGain = undefined;
		var gainResult = undefined;
		var action = undefined;
		if(currentGain != undefined  && !isNaN(currentGain.gain)){
			bestGain = currentGain.gain;
			gainResult = currentGain;
			action = 0;
		}
		if(downstairsGain != undefined  && !isNaN(downstairsGain.gain) && ((downstairsRawPoints > bestGain) || bestGain == undefined)){
			bestGain = downstairsGain.gain;
			gainResult = downstairsGain;
			action =  -1;
		}
		
		if(upstairsGain != undefined  && !isNaN(upstairsGain.gain) && (upstairsRawPoints > bestGain || bestGain == undefined)){
			bestGain = upstairsGain.gain;
			gainResult = upstairsGain;
			action = 1;
		}
		
		var originalTarget = this.targets.filter(function(t){
			if(t.target.position == target.originalTarget)
				return true;
			else
				return false;
		});
		
		if(gainResult == undefined){
			return finalResult = {action : -3, newPosition : undefined, newDistance : undefined, newVector : undefined, scored: false};
		}

		var scored = this.isInTarget(gainResult.newPosition,this.getOriginalTarget(target)) || this.isInAnyOtherTarget(gainResult.newPosition,target);
		var finalResult = {action: action, newPosition : gainResult.newPosition, newDistance : gainResult.newDistance, newHeight: currentHeight + gainResult.action, newVector: gainResult.newVector, scored: scored}
		if(!isTest)
			console.log('finalResult: ' + finalResult);
		
		return finalResult;
		
	},
	forwardAnalisys: function(depth,currentPosition,currentHeight,target, rankingCriteria){
		var TotalPoints = 0;
		var CurrentPoints = 0;
		var UpstairsPoints = 0;
		var DownstairsPoints = 0;


		var windArray = this.getWindArray(currentPosition,currentHeight);
		var validity = this.getValidityArray(currentPosition,currentHeight);

		var validityPoints = 0;
		for(var i=0;i<validity.length;i++){
			if(validity[i])
				validityPoints++;
		}

		var currentGain = 0;
		var downstairsGain = 0;
		var upstairsGain = 0;
		
		var currentTargetGain = 0;
		var downstairsTargetGain = 0;
		var upstairsTargetGain = 0;

		var currentOtherTargetGain = 0;
		var downstairsOtherTargetGain = 0;
		var upstairsOtherTargetGain = 0;


		var distanceGainTotal = 0;
		var targetTotal = 0;
		var otherTargetTotal = 0;
		
		for(var i=0;i<validity.length;i++){
			switch(i){
				case 0:
					if(validity[0] != undefined && validity[0]){
						downstairsGain = this.calculateDistanceGain(windArray[0],target,currentPosition);
						distanceGainTotal += downstairsGain.gain;
						downstairsTargetGain += (this.isInTarget(downstairsGain.newPosition, this.getOriginalTarget(target))) ? rankingCriteria.scoredTargetMultiplier : 0;
						targetTotal += downstairsTargetGain;
						downstairsOtherTargetGain += (this.isInAnyOtherTarget(downstairsGain.newPosition,target)) ? rankingCriteria.scoredOtherMultiplier : 0;
						otherTargetTotal += downstairsOtherTargetGain;

					}
					break;
				case 1:
					if(validity[1] != undefined && validity[1]){
						currentGain = this.calculateDistanceGain(windArray[1],target,currentPosition);
						distanceGainTotal += currentGain.gain;
						currentTargetGain += (this.isInTarget(currentGain.newPosition, this.getOriginalTarget(target))) ? rankingCriteria.scoredTargetMultiplier : 0;
						targetTotal += currentTargetGain;
						currentOtherTargetGain += (this.isInAnyOtherTarget(currentGain.newPosition,target)) ? rankingCriteria.scoredOtherMultiplier : 0;
						otherTargetTotal += currentOtherTargetGain;
					}
					break;
				case 2:
					if(validity[2] != undefined && validity[2]){
						upstairsGain = this.calculateDistanceGain(windArray[2],target,currentPosition);
						distanceGainTotal += upstairsGain.gain;
						upstairsTargetGain += (this.isInTarget(upstairsGain.newPosition, this.getOriginalTarget(target))) ? rankingCriteria.scoredTargetMultiplier : 0;
						targetTotal += upstairsTargetGain;
						upstairsOtherTargetGain += (this.isInAnyOtherTarget(upstairsGain.newPosition,target)) ? rankingCriteria.scoredOtherMultiplier : 0;
						otherTargetTotal += upstairsOtherTargetGain;
					}
						
					break;
			}
		}
		
		var bestBranch = -3;
		if(rankingCriteria.evaluateOnlyBestBranch){

			CurrentPoints = (validity[1] != undefined && validity[1]) ?  Math.floor(currentGain.gain * rankingCriteria.distanceMultiplier) + currentTargetGain + currentOtherTargetGain + ( validityPoints * rankingCriteria.validityMultiplier) : 0;
			DownstairsPoints =(validity[0] != undefined && validity[0]) ? Math.floor(downstairsGain.gain * rankingCriteria.distanceMultiplier) + downstairsTargetGain + downstairsOtherTargetGain + ( validityPoints * rankingCriteria.validityMultiplier) : 0;
			UpstairsPoints = (validity[2] != undefined && validity[2]) ?  Math.floor(upstairsGain.gain * rankingCriteria.distanceMultiplier) + upstairsTargetGain + upstairsOtherTargetGain + ( validityPoints * rankingCriteria.validityMultiplier) : 0;



			TotalPoints = Math.max(CurrentPoints,Math.max(DownstairsPoints,UpstairsPoints));

			if(TotalPoints == CurrentPoints){
				bestBranch = 0;
			}else if(TotalPoints == UpstairsPoints){
				bestBranch = 1;
			}else{
				bestBranch = -1;
			}

		}else{
			TotalPoints = Math.floor(distanceGainTotal * rankingCriteria.distanceMultiplier) + targetTotal + otherTargetTotal + ( validityPoints * rankingCriteria.validityMultiplier);	
		}
		
		if(depth == 0){
			return TotalPoints;	
		}
		else{
			var downForward = (validity[0] && ((bestBranch == -3) || bestBranch == -1)) ? this.forwardAnalisys(depth-1,downstairsGain.newPosition,currentHeight - 1,target,rankingCriteria) : 0;
			var currentForward = (validity[1] && ((bestBranch == -3) || bestBranch == 0)) ? this.forwardAnalisys(depth-1,currentGain.newPosition,currentHeight,target,rankingCriteria) : 0;
			var upstairsForward = (validity[2] && ((bestBranch == -3) || bestBranch == 1)) ? this.forwardAnalisys(depth-1,upstairsGain.newPosition,currentHeight + 1,target,rankingCriteria) : 0;
			
			return TotalPoints + downForward + currentForward + upstairsForward;
		}
	},
	calculateDistanceGain:function(wind, target,position){
		var nextPosition = [position[0] + wind[0],position[1] + wind[1]];
		if(nextPosition[1] < 0){
			nextPosition[1] = (this.worldWidth - 1) + nextPosition[1];
		}else if (nextPosition[1] > (this.worldWidth - 1)){
			nextPosition[1] = nextPosition[1] - (this.worldWidth - 1);
		}

		var distanceHeight = Math.abs(nextPosition[0] - target.target[0]);
		
		var util = Object.create(Utilities);
		var bestWidthDistance = util.columnDistance(nextPosition[1],target.target[1],this.worldWidth);
		
		var newDistance = bestWidthDistance + distanceHeight;
		
		var distanceHeightVector = target.target[0] - nextPosition[0];
		var widthVector = (util.isBestLeft(nextPosition[1],target.target[1],this.worldWidth) && bestWidthDistance != 0) ? bestWidthDistance*(-1) : bestWidthDistance;
		var newVector = [distanceHeightVector,widthVector];

		var gainObject = { gain : target.distance - newDistance, newDistance: newDistance, newPosition : nextPosition, newVector : newVector};
		
		return gainObject;
	},
	isAValidMove: function(currentPosition, wind){
		if(currentPosition[0] + wind[0] > this.worldHeight || currentPosition[0] + wind[0] < 0)
				return false;
			else
				return true;
	},
	startSimulation: function(depth, rankingCriteria, criteriaSteps, tuningDepth){
		console.log('---------STARTING SIMULATION---------');
		var score = 0;
		var balloonsCopy = this.rankedBalloons.map(function(item){
			return JSON.parse(JSON.stringify(item));
		});
		for(var i=0;i<this.nTurns;i++){
			console.log('--- TURN ' + i + '---');

			if(tuningDepth > 0){
				var tunedCriteria = this.tuneCriteria(balloonsCopy,depth,rankingCriteria,criteriaSteps,tuningDepth);
				
				console.log('Tuned Criteria for turn: ' + i);
				console.log(tunedCriteria)
			}

			var turnResult = (tuningDepth == 0) ? this.playTurn(balloonsCopy,depth,rankingCriteria, false) : this.playTurn(balloonsCopy,depth,tunedCriteria, false);
			balloonsCopy = turnResult.balloonsCopy;
			if(tuningDepth > 0)
				rankingCriteria = tunedCriteria;

			if(balloonsCopy.length == 0){
				console.log('no more balloons, exiting');
				break;
			}
			score += turnResult.partialScore;

			console.log('Partial score: ' + score);
			console.log('Balloons remaining: ' + balloonsCopy.length);
		}
		console.log('********** SCORE: ' + score + '*************');
		console.log('-----------SIMULATION FINISHED------------');
		return score;
	},
	playTurn: function(balloonsCopy,depth,rankingCriteria,isTest){
		for(var j = 0; j<balloonsCopy.length;j++){
				if(!isTest)
					console.log('-BALLOON ' + j + '-');
				//console.log(this.rankedBalloons[j].balloon)
				var moveData = this.evaluateBestMove(balloonsCopy[j].balloon.position,balloonsCopy[j].balloon.height,balloonsCopy[j].balloon.target,depth,rankingCriteria,isTest);
				if(moveData.action == -3){
					balloonsCopy.splice(j,1);
				}else{
					balloonsCopy[j].balloon.position = moveData.newPosition;
					balloonsCopy[j].balloon.height = balloonsCopy[j].balloon.height + moveData.action;
					balloonsCopy[j].balloon.target.target.vector = moveData.newVector;
					balloonsCopy[j].balloon.target.target.distance = moveData.newDistance;
					if(!isTest){
						console.log('action: ' + moveData.action);
						console.log('newHeight: ' + (balloonsCopy[j].balloon.height + moveData.action));
						console.log('newPos:' + moveData.newPosition);
						console.log('point: ' + moveData.scored);	
					}
				}
			}
			var partialScore = this.countPoints(balloonsCopy);

			return{partialScore: partialScore, balloonsCopy: balloonsCopy};
	},
	getGradients: function(){
		var allGradients = [];

		allGradients.push([0,0,0,0,0]);
		allGradients.push([0,0,0,0,1]);
		allGradients.push([0,0,0,0,-1]);

		allGradients.push([0,0,0,1,0]);
		allGradients.push([0,0,0,-1,0]);

		allGradients.push([0,0,0,1,1]);
		allGradients.push([0,0,0,1,-1]);
		allGradients.push([0,0,0,-1,1]);
		allGradients.push([0,0,0,-1,-1]);

		allGradients.push([0,0,1,0,0]);
		allGradients.push([0,0,-1,0,0]);
		
		allGradients.push([0,0,1,0,1]);
		allGradients.push([0,0,1,0,-1]);
		allGradients.push([0,0,-1,0,1]);
		allGradients.push([0,0,-1,0,-1]);
		
		allGradients.push([0,0,1,1,0]);
		allGradients.push([0,0,1,-1,0]);
		allGradients.push([0,0,-1,1,0]);
		allGradients.push([0,0,-1,-1,0]);

		allGradients.push([0,0,1,1,1]);
		allGradients.push([0,0,1,1,-1]);
		allGradients.push([0,0,1,-1,1]);
		allGradients.push([0,0,1,-1,-1]);
		allGradients.push([0,0,-1,1,1]);
		allGradients.push([0,0,-1,1,-1]);
		allGradients.push([0,0,-1,-1,1]);
		allGradients.push([0,0,-1,-1,-1]);
		
		allGradients.push([0,1,0,0,0]);
		allGradients.push([0,-1,0,0,0]);

		allGradients.push([0,1,0,0,1]);
		allGradients.push([0,1,0,0,-1]);
		allGradients.push([0,-1,0,0,1]);
		allGradients.push([0,-1,0,0,-1]);
		
		allGradients.push([0,1,0,1,0]);
		allGradients.push([0,1,0,-1,0]);
		allGradients.push([0,-1,0,1,0]);
		allGradients.push([0,-1,0,-1,0]);

		allGradients.push([0,1,0,1,1]);
		allGradients.push([0,1,0,1,-1]);
		allGradients.push([0,1,0,-1,1]);
		allGradients.push([0,1,0,-1,-1]);
		allGradients.push([0,-1,0,1,1]);
		allGradients.push([0,-1,0,1,-1]);
		allGradients.push([0,-1,0,-1,1]);
		allGradients.push([0,-1,0,-1,-1]);

		allGradients.push([0,1,1,0,0]);
		allGradients.push([0,1,-1,0,0]);
		allGradients.push([0,-1,1,0,0]);
		allGradients.push([0,-1,-1,0,0]);

		allGradients.push([0,1,1,0,1]);
		allGradients.push([0,1,1,0,-1]);
		allGradients.push([0,1,-1,0,1]);
		allGradients.push([0,1,-1,0,-1]);
		allGradients.push([0,-1,1,0,1]);
		allGradients.push([0,-1,1,0,-1]);
		allGradients.push([0,-1,-1,0,1]);
		allGradients.push([0,-1,-1,0,-1]);

		allGradients.push([0,1,1,1,0]);
		allGradients.push([0,1,1,-1,0]);
		allGradients.push([0,1,-1,1,0]);
		allGradients.push([0,1,-1,-1,0]);
		allGradients.push([0,-1,1,1,0]);
		allGradients.push([0,-1,1,-1,0]);
		allGradients.push([0,-1,-1,1,0]);
		allGradients.push([0,-1,-1,-1,0]);

		allGradients.push([0,1,1,1,1]);
		allGradients.push([0,1,1,1,-1]);
		allGradients.push([0,1,1,-1,1]);
		allGradients.push([0,1,1,-1,-1]);
		allGradients.push([0,1,-1,1,1]);
		allGradients.push([0,1,-1,1,-1]);
		allGradients.push([0,1,-1,-1,1]);
		allGradients.push([0,1,-1,-1,-1]);
		allGradients.push([0,-1,1,1,1]);
		allGradients.push([0,-1,1,1,-1]);
		allGradients.push([0,-1,1,-1,1]);
		allGradients.push([0,-1,1,-1,-1]);
		allGradients.push([0,-1,-1,1,1]);
		allGradients.push([0,-1,-1,1,-1]);
		allGradients.push([0,-1,-1,-1,1]);
		allGradients.push([0,-1,-1,-1,-1]);

		//--------

		allGradients.push([1,0,0,0,0]);
		allGradients.push([1,0,0,0,1]);
		allGradients.push([1,0,0,0,-1]);

		allGradients.push([1,0,0,1,0]);
		allGradients.push([1,0,0,-1,0]);

		allGradients.push([1,0,0,1,1]);
		allGradients.push([1,0,0,1,-1]);
		allGradients.push([1,0,0,-1,1]);
		allGradients.push([1,0,0,-1,-1]);

		allGradients.push([1,0,1,0,0]);
		allGradients.push([1,0,-1,0,0]);
		
		allGradients.push([1,0,1,0,1]);
		allGradients.push([1,0,1,0,-1]);
		allGradients.push([1,0,-1,0,1]);
		allGradients.push([1,0,-1,0,-1]);
		
		allGradients.push([1,0,1,1,0]);
		allGradients.push([1,0,1,-1,0]);
		allGradients.push([1,0,-1,1,0]);
		allGradients.push([1,0,-1,-1,0]);

		allGradients.push([1,0,1,1,1]);
		allGradients.push([1,0,1,1,-1]);
		allGradients.push([1,0,1,-1,1]);
		allGradients.push([1,0,1,-1,-1]);
		allGradients.push([1,0,-1,1,1]);
		allGradients.push([1,0,-1,1,-1]);
		allGradients.push([1,0,-1,-1,1]);
		allGradients.push([1,0,-1,-1,-1]);
		
		allGradients.push([1,1,0,0,0]);
		allGradients.push([1,-1,0,0,0]);

		allGradients.push([1,1,0,0,1]);
		allGradients.push([1,1,0,0,-1]);
		allGradients.push([1,-1,0,0,1]);
		allGradients.push([1,-1,0,0,-1]);
		
		allGradients.push([1,1,0,1,0]);
		allGradients.push([1,1,0,-1,0]);
		allGradients.push([1,-1,0,1,0]);
		allGradients.push([1,-1,0,-1,0]);

		allGradients.push([1,1,0,1,1]);
		allGradients.push([1,1,0,1,-1]);
		allGradients.push([1,1,0,-1,1]);
		allGradients.push([1,1,0,-1,-1]);
		allGradients.push([1,-1,0,1,1]);
		allGradients.push([1,-1,0,1,-1]);
		allGradients.push([1,-1,0,-1,1]);
		allGradients.push([1,-1,0,-1,-1]);

		allGradients.push([1,1,1,0,0]);
		allGradients.push([1,1,-1,0,0]);
		allGradients.push([1,-1,1,0,0]);
		allGradients.push([1,-1,-1,0,0]);

		allGradients.push([1,1,1,0,1]);
		allGradients.push([1,1,1,0,-1]);
		allGradients.push([1,1,-1,0,1]);
		allGradients.push([1,1,-1,0,-1]);
		allGradients.push([1,-1,1,0,1]);
		allGradients.push([1,-1,1,0,-1]);
		allGradients.push([1,-1,-1,0,1]);
		allGradients.push([1,-1,-1,0,-1]);

		allGradients.push([1,1,1,1,0]);
		allGradients.push([1,1,1,-1,0]);
		allGradients.push([1,1,-1,1,0]);
		allGradients.push([1,1,-1,-1,0]);
		allGradients.push([1,-1,1,1,0]);
		allGradients.push([1,-1,1,-1,0]);
		allGradients.push([1,-1,-1,1,0]);
		allGradients.push([1,-1,-1,-1,0]);

		allGradients.push([1,1,1,1,1]);
		allGradients.push([1,1,1,1,-1]);
		allGradients.push([1,1,1,-1,1]);
		allGradients.push([1,1,1,-1,-1]);
		allGradients.push([1,1,-1,1,1]);
		allGradients.push([1,1,-1,1,-1]);
		allGradients.push([1,1,-1,-1,1]);
		allGradients.push([1,1,-1,-1,-1]);
		allGradients.push([1,-1,1,1,1]);
		allGradients.push([1,-1,1,1,-1]);
		allGradients.push([1,-1,1,-1,1]);
		allGradients.push([1,-1,1,-1,-1]);
		allGradients.push([1,-1,-1,1,1]);
		allGradients.push([1,-1,-1,1,-1]);
		allGradients.push([1,-1,-1,-1,1]);
		allGradients.push([1,-1,-1,-1,-1]);

		//---

		allGradients.push([-1,0,0,0,0]);
		allGradients.push([-1,0,0,0,1]);
		allGradients.push([-1,0,0,0,-1]);

		allGradients.push([-1,0,0,1,0]);
		allGradients.push([-1,0,0,-1,0]);

		allGradients.push([-1,0,0,1,1]);
		allGradients.push([-1,0,0,1,-1]);
		allGradients.push([-1,0,0,-1,1]);
		allGradients.push([-1,0,0,-1,-1]);

		allGradients.push([-1,0,1,0,0]);
		allGradients.push([-1,0,-1,0,0]);
		
		allGradients.push([-1,0,1,0,1]);
		allGradients.push([-1,0,1,0,-1]);
		allGradients.push([-1,0,-1,0,1]);
		allGradients.push([-1,0,-1,0,-1]);
		
		allGradients.push([-1,0,1,1,0]);
		allGradients.push([-1,0,1,-1,0]);
		allGradients.push([-1,0,-1,1,0]);
		allGradients.push([-1,0,-1,-1,0]);

		allGradients.push([-1,0,1,1,1]);
		allGradients.push([-1,0,1,1,-1]);
		allGradients.push([-1,0,1,-1,1]);
		allGradients.push([-1,0,1,-1,-1]);
		allGradients.push([-1,0,-1,1,1]);
		allGradients.push([-1,0,-1,1,-1]);
		allGradients.push([-1,0,-1,-1,1]);
		allGradients.push([-1,0,-1,-1,-1]);
		
		allGradients.push([-1,1,0,0,0]);
		allGradients.push([-1,-1,0,0,0]);

		allGradients.push([-1,1,0,0,1]);
		allGradients.push([-1,1,0,0,-1]);
		allGradients.push([-1,-1,0,0,1]);
		allGradients.push([-1,-1,0,0,-1]);
		
		allGradients.push([-1,1,0,1,0]);
		allGradients.push([-1,1,0,-1,0]);
		allGradients.push([-1,-1,0,1,0]);
		allGradients.push([-1,-1,0,-1,0]);

		allGradients.push([-1,1,0,1,1]);
		allGradients.push([-1,1,0,1,-1]);
		allGradients.push([-1,1,0,-1,1]);
		allGradients.push([-1,1,0,-1,-1]);
		allGradients.push([-1,-1,0,1,1]);
		allGradients.push([-1,-1,0,1,-1]);
		allGradients.push([-1,-1,0,-1,1]);
		allGradients.push([-1,-1,0,-1,-1]);

		allGradients.push([-1,1,1,0,0]);
		allGradients.push([-1,1,-1,0,0]);
		allGradients.push([-1,-1,1,0,0]);
		allGradients.push([-1,-1,-1,0,0]);

		allGradients.push([-1,1,1,0,1]);
		allGradients.push([-1,1,1,0,-1]);
		allGradients.push([-1,1,-1,0,1]);
		allGradients.push([-1,1,-1,0,-1]);
		allGradients.push([-1,-1,1,0,1]);
		allGradients.push([-1,-1,1,0,-1]);
		allGradients.push([-1,-1,-1,0,1]);
		allGradients.push([-1,-1,-1,0,-1]);

		allGradients.push([-1,1,1,1,0]);
		allGradients.push([-1,1,1,-1,0]);
		allGradients.push([-1,1,-1,1,0]);
		allGradients.push([-1,1,-1,-1,0]);
		allGradients.push([-1,-1,1,1,0]);
		allGradients.push([-1,-1,1,-1,0]);
		allGradients.push([-1,-1,-1,1,0]);
		allGradients.push([-1,-1,-1,-1,0]);

		allGradients.push([-1,1,1,1,1]);
		allGradients.push([-1,1,1,1,-1]);
		allGradients.push([-1,1,1,-1,1]);
		allGradients.push([-1,1,1,-1,-1]);
		allGradients.push([-1,1,-1,1,1]);
		allGradients.push([-1,1,-1,1,-1]);
		allGradients.push([-1,1,-1,-1,1]);
		allGradients.push([-1,1,-1,-1,-1]);
		allGradients.push([-1,-1,1,1,1]);
		allGradients.push([-1,-1,1,1,-1]);
		allGradients.push([-1,-1,1,-1,1]);
		allGradients.push([-1,-1,1,-1,-1]);
		allGradients.push([-1,-1,-1,1,1]);
		allGradients.push([-1,-1,-1,1,-1]);
		allGradients.push([-1,-1,-1,-1,1]);
		allGradients.push([-1,-1,-1,-1,-1]);
		
		return allGradients;
	},
	tuneCriteria: function(balloonsCopy,depth,rankingCriteria,criteriaSteps,tuningDepth){
		console.log('--- TUNING START ---');
		var allGradients = this.getGradients();
		var foundSomething = false;

		var resultCriteria = Object.create(RankingCriteria);
		var currentBest = 0;
		for(var j=1;j<tuningDepth+1;j++){
			for(var i=0;i<allGradients.length;i++){
				var currentBalloonCopy = balloonsCopy.map(function(item){
					return JSON.parse(JSON.stringify(item));
				});
				var myTestCriteria = Object.create(RankingCriteria);
				myTestCriteria = JSON.parse(JSON.stringify(rankingCriteria));

				myTestCriteria.distanceMultiplier += allGradients[i][0] * (criteriaSteps.validityMultiplier * j);
				myTestCriteria.scoredTargetMultiplier += allGradients[i][1] * (criteriaSteps.scoredTargetMultiplier * j);
				myTestCriteria.scoredOtherMultiplier += allGradients[i][2] * (criteriaSteps.scoredOtherMultiplier * j);
				myTestCriteria.distanceFirstMoveMultiplier += allGradients[i][3] * (criteriaSteps.distanceFirstMoveMultiplier * j);
				myTestCriteria.scoredTargetFirstMove += allGradients[i][4] * (criteriaSteps.scoredTargetFirstMove * j);
				myTestCriteria.scoredOtherFirstMove = myTestCriteria.scoredTargetFirstMove;

				var testTurn = this.playTurn(currentBalloonCopy,depth,myTestCriteria,true);
				console.log('testTurn: (gradient,depth) : score -> (' + i + ',' + j + ') : ' + testTurn.partialScore);
				
				if(currentBest < testTurn.partialScore){
					currentBest = testTurn.partialScore;
					resultCriteria = JSON.parse(JSON.stringify(myTestCriteria));
					foundSomething = true;

					console.log('better hitted');
				}
			}	
		}
		console.log('--- TUNING END ---');
		console.log('Expected score:' + currentBest);
		console.log('Tuned function: ');
		console.log(resultCriteria);
		return (foundSomething) ? resultCriteria : rankingCriteria;
	}
}

var Parser = {
	textToParse : "",
	getWorldWidth: function(firstLine){
		return firstLine.split(' ')[1];
	},
	getWorldHeight: function(firstLine){
		return firstLine.split(' ')[0];
	},
	getNumberOfHeights: function(firstLine){
			firstLine.split(' ')[2];
	}
}

var RankingCriteria = {
	validityMultiplier : 0,
	distanceMultiplier : 0,
	scoredTargetMultiplier : 0,
	scoredOtherMultiplier : 0,
	distanceFirstMoveMultiplier : 0,
	scoredTargetFirstMove : 0,
	scoredOtherFirstMove : 0,
	evaluateOnlyBestBranch : false
}

var TURNS = 50;;
var BALLOONS = 10;
var HEIGHTS = 10;
var WORLD_HEIGHT = 100;
var WORLD_WIDTH = 100;
var TARGETS = 20;
var BALLOON_COVERAGE = 3;

var WorldManager = Object.create(Manager);
WorldManager.initialize(TURNS, BALLOONS, HEIGHTS, WORLD_HEIGHT, WORLD_WIDTH, TARGETS, BALLOON_COVERAGE);
WorldManager.assignTargets(true);
var Ranking3 = Object.create(RankingCriteria);
Ranking3.validityMultiplier = 0;
Ranking3.distanceMultiplier = 0.1;
Ranking3.scoredTargetMultiplier = 50;
Ranking3.scoredOtherMultiplier = 50;
Ranking3.distanceFirstMoveMultiplier = 0.33;
Ranking3.scoredTargetFirstMove = 500;
Ranking3.scoredOtherFirstMove = 500;

//var score3 = WorldManager.startSimulation(4,Ranking3);

Ranking3.evaluateOnlyBestBranch = true;

var Steps3 = Object.create(RankingCriteria);
Steps3.validityMultiplier = 0;
Steps3.distanceMultiplier = 0.30;
Steps3.scoredTargetMultiplier = 50;
Steps3.scoredOtherMultiplier = 50;
Steps3.distanceFirstMoveMultiplier = 0.30;
Steps3.scoredTargetFirstMove = 50;
Steps3.scoredOtherFirstMove = 50;

//var score3 = WorldManager.startSimulation(4,Ranking3);

Ranking3.evaluateOnlyBestBranch = true;
var scoreClassic = WorldManager.startSimulation(4,Ranking3,Steps3,0);
WorldManager.resetBalloonPositions();
var score8 = WorldManager.startSimulation(4,Ranking3,Steps3,3);
WorldManager.resetBalloonPositions();

Steps3.validityMultiplier = 0;
Steps3.distanceMultiplier = 1;
Steps3.scoredTargetMultiplier = 100;
Steps3.scoredOtherMultiplier = 100;
Steps3.distanceFirstMoveMultiplier = 1;
Steps3.scoredTargetFirstMove = 150;
Steps3.scoredOtherFirstMove = 150;


var scoreBigSteps = WorldManager.startSimulation(4,Ranking3,Steps3,3);
//var Ranking2 = Object.create(RankingCriteria);
//Ranking2.validityMultiplier = 0;
//Ranking2.distanceMultiplier = 0.1;
//Ranking2.scoredTargetMultiplier = 0;
//Ranking2.scoredOtherMultiplier = 0;
//Ranking2.distanceFirstMoveMultiplier = 0.33;
//Ranking2.scoredTargetFirstMove = 0;
//Ranking2.scoredOtherFirstMove = 0;

//WorldManager.resetBalloonPositions();
//var score2 = WorldManager.startSimulation(4,Ranking2);

//var Ranking1 = Object.create(RankingCriteria);
//Ranking1.validityMultiplier = 0;
//Ranking1.distanceMultiplier = 0;
//Ranking1.scoredTargetMultiplier = 50;
//Ranking1.scoredOtherMultiplier = 50;
//Ranking1.distanceFirstMoveMultiplier = 0;
//Ranking1.scoredTargetFirstMove = 500;
//Ranking1.scoredOtherFirstMove = 500;


//WorldManager.resetBalloonPositions();
//var score1 = WorldManager.startSimulation(4,Ranking1);

//Ranking1.evaluateOnlyBestBranch = true;
//var score7 = WorldManager.startSimulation(4,Ranking1); 

//WorldManager.resetBalloonPositions();
//var score4 = WorldManager.startSimulation(5,Ranking1);

//WorldManager.resetBalloonPositions();
//var score5 = WorldManager.startSimulation(6,Ranking1);

//WorldManager.resetBalloonPositions();
//var score6 = WorldManager.startSimulation(3,Ranking1);





console.log('--- SUMMARY ---');
//console.log('--- Criteria1: targets depth 4 ---');
//console.log('SCORE: ' +score1);
//console.log('--- Criteria2: only distance ---');
//console.log('SCORE: ' + score2);
//console.log('--- Criteria3: both ---');
//console.log('SCORE: ' + score3);
//console.log('--- Criteria4: targets depth 5 ---');
//console.log('SCORE: ' + score4);
//console.log('--- Criteria5: targets depth 6 ---');
//console.log('SCORE: ' + score5);
//console.log('--- Criteria5: targets depth 3 ---');
//console.log('SCORE: ' + score6);
//console.log('--- Criteria 6: targets depth 4 onlybestbranch ---');
//console.log('SCORE: ' + score7);
console.log('--- Classic criteria : both, onlybestbranch ---');
console.log('SCORE: ' + scoreClassic);
console.log('--- Tuned Criteria : both, onlybestbranch ---');
console.log('SCORE: ' + score8);
console.log('--- Tuned Criteria : both, onlybestbranch, bigsteps ---');
console.log('SCORE: ' + scoreBigSteps);
