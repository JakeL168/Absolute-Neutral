var game;
var stage;
var img =
{
	player_battle: 		"img/battle/player.png",
	enemy_battle: 		"img/battle/ogre.png",
	gui_battle: 		"img/battle/gui.png",
	tiles_battle: 		"img/battle/tiles.png"
};
var buttons = 
{
	UP: 0,
	DOWN: 0,
	LEFT: 0,
	RIGHT: 0,
	A: 0,
	B: 0
};

var player = 
{
	name: "Yoghat",
	hpInit: 5,
	decide: 5, // how much time ( in seconds ) this player is given to decide on which card to choose
	luck: 5, // out of 10, decide on what number card you're gonna get

	att: 0,
	def: 0,

	cardChoice: 0, // current card choice

	idleAnim: 	[ 0, 0, 0, 0, 1, 1, 1, 1 ],
	attAnim: 	[ 0, 0, 2, 2, 2, 2, 2, 2 ],
	defAnim: 	[ 0, 0, 3, 3, 3, 3, 3, 3 ]
};

var enemy =
{
	name: "Ogre",
	hpInit: 1,
	att: 1,
	def: 2,

	idleAnim: 	[ 0, 0, 0, 0, 1, 1, 1, 1 ],
	attAnim: 	[ 0, 0, 2, 2, 2, 2, 2, 2 ],
	defAnim: 	[ 0, 0, 3, 3, 3, 3, 3, 3 ]
};

var GameState =
{
	MENU: 0,
	DUNGEON: 1,
	BATTLE: 2
}

var BattleState =
{
	DECIDE: 0,
	ACT: 1,
	WAIT: 2,
	OVER: 3
}

var game =
{
	mainHPInit: 3,
	turn: -1, // if %2 equal 0, player's turn; else enemy's turn
};

//-------------------------------------------------- 
// CORE
//-------------------------------------------------- 
window.onload = function ()
{
	enchant ();

	game = new Game ( 600, 384 );
	game.preload
	(
		// images
		img.player_battle,
		img.enemy_battle,
		img.gui_battle,
		img.tiles_battle

		// audios
	);
	game.fps = 30;
	game.onload = function ()
	{
		game.rootScene.backgroundColor = "#843b62";

		RunGame ();
	}
	game.start ();
}

// Call everytime player got into a battle
function RunGame ()
{
	game.state = GameState.BATTLE;

	SetupBG ();
	SetupChars ();
	SetupUI ();
	SetupKeys ();

	Init ();
	
	game.addEventListener ( "enterframe", function ()
	{
		Main ();
	} );
}

//-------------------------------------------------- 
// GAMEPLAY
//--------------------------------------------------
function Init ()
{
	game.turn = -1;
	game.timer = undefined;
	
	player.hp = player.hpInit;
	player.cardChoice = 0;
	player.deck = undefined;

	enemy.hp = RandomRange ( 1, 9 );
	enemy.att = RandomRange ( 1, 6 );
	enemy.def = RandomRange ( 0, 6 );

	ChangeBattleState ( BattleState.DECIDE );
}

function AddGameTurn ()
{
	game.turn++;
	//console.log ( game.turn, IsPlayerTurn () );
	if ( IsPlayerTurn () )
	{
		game.playerUiTitle.text = "  " + player.name + ">>";
		game.enemyUiTitle.text = enemy.name;

		game.deckUiTitle.text = "ATTACK";
	}
	else
	{
		game.playerUiTitle.text = player.name;
		game.enemyUiTitle.text = "<<" + enemy.name + "  ";

		game.deckUiTitle.text = "DEFEND FROM";
	}

	var _toAdd = 3;
	if ( player.deck == undefined )
		player.deck = [];
	else
		_toAdd = ( 3 - player.deck.length );

	if ( _toAdd > 0 )
	{
		for ( var a=0; a<_toAdd; a++ )
		{
			var _val = 0;
			var _luck = Math.random () * 10;
			if ( _luck <= player.luck ) // is lucky
			{//console.log ( "LUCKY~!" );
				if ( IsPlayerTurn () ) // calculate a good ATT number
				{
					_val = RandomRange ( enemy.def, ( enemy.hp + enemy.def ) );
					while ( _val >= 10 )
						_val = RandomRange ( enemy.def, ( enemy.hp + enemy.def ) );
				}
				else // calculate a good DEF number, which is basically enemy's att
					_val = enemy.att;
			}
			else
			{
				_val = Math.round ( Math.random () * 10 );
				while ( _val >= 10 ) // ensure that it always get value between 0 to 9
					_val = Math.round ( Math.random () * 10 );
			}

			player.deck.push ( _val );
		}
	}
	
	game.timer = player.decide * game.fps;
}

function RandomRange ( _min, _max )
{
	if ( _max < _min )
		return;

	var _rand = Math.round ( Math.random () * ( _max - _min ) );
	_rand += _min;

	return _rand;
}

function IncrementCardChoice ()
{
	if ( game.battle != BattleState.DECIDE )
		return;

	player.cardChoice++;
	if ( player.cardChoice >= player.deck.length - 1 )
		player.cardChoice = ( player.deck.length - 1 );
}

function DecrementCardChoice ()
{
	if ( game.battle != BattleState.DECIDE )
		return;
	
	player.cardChoice--;
	if ( player.cardChoice <= 0 )
		player.cardChoice = 0;
}

function IsPlayerTurn ()
{
	return ( game.turn % 2 == 0 );
}

function SelectPlayerAction ()
{
	if ( game.battle != BattleState.DECIDE )
		return;

	var _val = player.deck[ player.cardChoice ];

	if ( IsPlayerTurn () )
		player.att = _val;
	else
		player.def = _val;
	
	player.deck.splice ( player.cardChoice, 1 );
	player.cardChoice = 0;
	ChangeBattleState ( BattleState.ACT );
}

//-------------------------------------------------- 
// GAME LOOP
//-------------------------------------------------- 
function ChangeBattleState ( _state )
{
	if ( game.battle != _state )
	{
		game.battle = _state;

		game.deckUiTitle.opacity = 1;
		game.deckUi[0].opacity = 1;
		game.deckUi[1].opacity = 1;
		game.deckUi[2].opacity = 1;

		game.deckUiBg[0].opacity = 1;
		game.deckUiBg[1].opacity = 1;
		game.deckUiBg[2].opacity = 1;

		game.bottomMsg.opacity = 0;

		switch ( game.battle )
		{
		case BattleState.DECIDE:
			player.att = 0;
			player.def = 0;

			AddGameTurn ();
			break;

		case BattleState.ACT:
			if ( IsPlayerTurn () )
			{
				if ( player.att > 0 )
				{
					player.sprite.frame = player.attAnim;
					enemy.sprite.frame = enemy.defAnim;
				}
			}
			else
			{
				enemy.sprite.frame = enemy.attAnim;

				if ( player.def > 0 )
				{
					player.sprite.frame = player.defAnim;
				}
			}

			game.timer = 8;
			break;

		case BattleState.WAIT:
			player.sprite.frame = player.idleAnim;
			enemy.sprite.frame = enemy.idleAnim;
			break;

		case BattleState.OVER:
			if ( player.hp <= 0 )
			{
				game.playerUiTitle.text = player.name;
				game.enemyUiTitle.text = "[ " + enemy.name + " ]";
				game.deckUiTitle.text = "DEFEATED BY";
			}
			else
			{
				game.playerUiTitle.text = "[ " + player.name + " ]";
				game.enemyUiTitle.text = enemy.name;
				game.deckUiTitle.text = "BEATEN";
			}

			game.deckUi[0].opacity = 0;
			game.deckUi[1].opacity = 0;
			game.deckUi[2].opacity = 0;

			game.deckUiBg[0].opacity = 0;
			game.deckUiBg[1].opacity = 0;
			game.deckUiBg[2].opacity = 0;

			game.bottomMsg.opacity = 1;
			game.bottomMsg.text = "press X to restart battle";
			break;
		}
	}
}

function Main ()
{
	Update_UI ();
	
	if ( game.timer != undefined )
	{
		--game.timer;
		if ( game.timer <= 0 )
			game.timer = undefined;
	}
	
	switch ( game.battle )
	{
	case BattleState.DECIDE:
		//if ( game.timer == undefined )
		//	ChangeBattleState ( BattleState.ACT );
		break;

	case BattleState.ACT:
		if ( game.timer == undefined )
		{
			if ( IsPlayerTurn () ) // attack on enemy
			{
				if ( player.att > 0 ) // only when player has att value
				{
					enemy.hp = Math.abs ( enemy.hp - ( player.att - enemy.def ) );
				}
			}
			else // get attack by enemy
			{
				var _val = ( player.hp - Math.abs ( enemy.att - player.def ) );
				if ( _val <= 0 )
					player.hp = 0;
				else
					player.hp = _val;
			}

			ChangeBattleState ( BattleState.WAIT );
		}
		break;

	case BattleState.WAIT:
		if ( game.timer == undefined )
		{
			if ( player.hp <= 0 || enemy.hp <= 0 )
				ChangeBattleState ( BattleState.OVER );
			else
				ChangeBattleState ( BattleState.DECIDE );
		}
		break;
	}
}

function Update_UI ()
{
	for ( var a=0; a<game.deckUi.length; a++ )
	{
		if ( a < player.deck.length )
			game.deckUi[a].text = player.deck[a];
		else
			game.deckUi[a].text = "";

		if ( a == player.cardChoice && game.battle == BattleState.DECIDE )
			game.deckUiBg[a].frame = 1;
		else
			game.deckUiBg[a].frame = 0;
	}

	game.playerUi.text = CreateContent ( player, true );
	game.enemyUi.text = CreateContent ( enemy, false );
}

function CreateContent ( _target, _useDash )
{
	var _att = "-";
	if ( _target.att > 0 || !_useDash )
		_att = _target.att;

	var _def = "-";
	if ( _target.def > 0 || !_useDash )
		_def = _target.def;

	var _content = "HP: " + _target.hp;
	_content += "<br/>ATT: " + _att;
	_content += "<br/>DEF: " + _def;

	return _content;
}

//-------------------------------------------------- 
// VISUAL SETUP - BATTLE
//-------------------------------------------------- 
function SetupBG ()
{
	//var _s = new Surface ( 600, 10 );
	//_s.y = 374;
	//_s.setPixel ( 0, 0, 0.5, 0.5, 0.5, 0.5 );
	//game.rootScene.addChild ( _s );

	var _bgs = [];
	for ( var c=0; c<5; c++ )
	{
		var _bgs_r = [];
		for ( var r=0; r<3; r++ )
		{
			var _bg = new Sprite ( 128, 128 );
			_bg.image = game.assets[ img.tiles_battle ];
			_bg.x = 128 * c;
			_bg.y = 128 * r;

			if ( r == 0 )
				_bg.frame = 1;
			else if ( r == 1 )
				_bg.frame = 22;
			else
				_bg.frame = 36;

			game.rootScene.addChild ( _bg );

			_bgs.push ( _bgs_r );
		}
	}	
}

function SetupChars () 
{
	// Setup Player
	var _p = new Sprite ( 128, 128 );
	_p.image = game.assets[ img.player_battle ];
	_p.frame = player.idleAnim;
	_p.x = 61;
	_p.y = 80;
	_p.scaleX = -1;
	game.rootScene.addChild ( _p );
	player.sprite = _p;

	// Setup Ogre
	var _o = new Sprite ( 128, 128 );
	_o.image = game.assets[ img.enemy_battle ];
	_o.frame = enemy.idleAnim; // TODO: Write a wrapper for the animation
	_o.x = 411;
	_o.y = 80;
	game.rootScene.addChild ( _o );
	enemy.sprite = _o;
}

function SetupUI ()
{
	// PLAYER - Title
	var _pUiTitle = MakeLabel ( "PLAYER", 0, 243, "25px Pixel6", "#ffffff" );
	game.playerUiTitle = _pUiTitle;

	// PLAYER - Stats
	var _pUi = MakeLabel ( "HP: 3", 0, 270, "25px Pixel6", "#ffffff" );
	game.playerUi = _pUi;

	// PLAYER - Deck
	var _pDeckTitle = MakeLabel ( "ATTACK:", 0, 243, "25px Pixel6", "#ffffff" );
	_pDeckTitle.width = 200;
	_pDeckTitle.x = 200;
	game.deckUiTitle = _pDeckTitle;

	var _pDeckUiBGs = [];
	var _pDecks = [];
	var _deckBoxSize = 64;
	var _deckUiSizeAll = _deckBoxSize * 3;
	var _startX = 300 - _deckUiSizeAll / 2;
	for ( var a=0; a<3; a++ )
	{
		var _x = _startX + _deckBoxSize * a;
		var _deckBox = new Sprite ( _deckBoxSize, _deckBoxSize );
		_deckBox.image = game.assets[ img.gui_battle ];
		_deckBox.frame = 0;
		_deckBox.x = _x;
		_deckBox.y = 270;
		game.rootScene.addChild ( _deckBox );
		_pDeckUiBGs.push ( _deckBox );

		var _deck = MakeLabel ( "9", _x + 2, 282, "46px Pixel6", "#ffffff" )
		_deck.width = _deckBoxSize;
		_deck.height = _deckBoxSize;
		_pDecks.push ( _deck );
	}
	game.deckUiBg = _pDeckUiBGs;
	game.deckUi = _pDecks;

	// ENEMY - Title
	var _eUiTitle = MakeLabel ( "OGRE", 400, 243, "25px Pixel6", "#ffffff" );
	game.enemyUiTitle = _eUiTitle;

	// ENEMY - Stats
	var _eUi = MakeLabel ( "HP: 1<br/>ATT: 1<br/>DEF: 1", 400, 270, "25px Pixel6", "#ffffff" );
	game.enemyUi = _eUi;

	var _bMsg = MakeLabel ( "<Empty>", 0, 350, "20px Pixel6", "#ffffff" );
	_bMsg.width = 600;
	game.bottomMsg = _bMsg;
}

function MakeLabel ( _text, _x, _y, _font, _color )
{
	var _ui = new Label ( _text );
	_ui.font = _font;
	_ui.color = _color;
	_ui.x = _x;
	_ui.y = _y;
	_ui.width = 200;
	_ui.textAlign = "center";
	game.rootScene.addChild ( _ui );

	return _ui;
}

//-------------------------------------------------- 
// CONTROLS
//-------------------------------------------------- 
function SetupKeys ()
{
	// bind Z to A
	game.keybind ( 90, "a" );
	// bind X to B
	game.keybind ( 88, "b" );
	
	// UP	
	game.addEventListener ( "upbuttondown", function (){ Key_UP ( true ); } );
	game.addEventListener ( "upbuttonup", function (){ Key_UP ( false ); } );
	// DOWN
	game.addEventListener ( "downbuttondown", function (){ Key_DOWN ( true ); } );
	game.addEventListener ( "downbuttonup", function (){ Key_DOWN ( false ); } );
	// LEFT
	game.addEventListener ( "leftbuttondown", function (){ Key_LEFT ( true ); } );
	game.addEventListener ( "leftbuttonup", function (){ Key_LEFT ( false ); } );
	// RIGHT
	game.addEventListener ( "rightbuttondown", function (){ Key_RIGHT ( true ); } );
	game.addEventListener ( "rightbuttonup", function (){ Key_RIGHT ( false ); } );
	// A
	game.addEventListener ( "abuttondown", function (){ Key_A ( true ); } );
	game.addEventListener ( "abuttonup", function (){  Key_A ( false ); } );
	// B
	game.addEventListener ( "bbuttondown", function (){ Key_B ( true ); } );
	game.addEventListener ( "bbuttonup", function (){ Key_B ( false ); } );
}

function Key_UP ( _isDown )
{
	if ( _isDown )
	{
		
	}
	else
	{
		
	}
}

function Key_DOWN ( _isDown )
{
	if ( _isDown )
	{
		
	}
	else
	{
		
	}
}

function Key_LEFT ( _isDown )
{
	if ( _isDown )
	{
		DecrementCardChoice ();
	}
	else
	{
		
	}
}

function Key_RIGHT ( _isDown )
{
	if ( _isDown )
	{
		IncrementCardChoice ();
	}
	else
	{
		
	}
}

function Key_A ( _isDown )
{
	if ( _isDown )
	{
		SelectPlayerAction ();
	}
}

function Key_B ( _isDown )
{
	if ( _isDown )
	{
		if ( game.battle == BattleState.OVER )
			Init ();
	}
}

//-------------------------------------------------- 
// CLASSES
//-------------------------------------------------- 
function Vector2 ( _x, _y )
{
	this.x = _x;
	this.y = _y;
}
