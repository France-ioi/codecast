const Blockly: any = {Msg: {}};

Blockly.Msg.VARIABLES_DEFAULT_NAME = "element";
Blockly.Msg.CONTROLS_REPEAT_INPUT_DO = "";

Blockly.Msg.DICTS_CREATE_EMPTY_TITLE = "dictionnaire vide";
Blockly.Msg.DICTS_CREATE_WITH_CONTAINER_TITLE_ADD = "Créer un dictionnaire";
Blockly.Msg.DICTS_CREATE_WITH_CONTAINER_TOOLTIP = "";
Blockly.Msg.DICTS_CREATE_WITH_INPUT_WITH = "créer un dictionnaire :";
Blockly.Msg.DICTS_CREATE_WITH_ITEM_KEY = "cle";
Blockly.Msg.DICTS_CREATE_WITH_ITEM_MAPPING = ":";
Blockly.Msg.DICTS_CREATE_WITH_ITEM_TITLE = "clé/valeur";
Blockly.Msg.DICTS_CREATE_WITH_ITEM_TOOLTIP = "";
Blockly.Msg.DICTS_CREATE_WITH_TOOLTIP = "";
Blockly.Msg.DICT_GET = "récupérer la clé";
Blockly.Msg.DICT_GET_TO = "de";
Blockly.Msg.DICT_KEYS = "liste des clés de";
Blockly.Msg.DICT_SET_TITLE = "affecter la clé";
Blockly.Msg.DICT_SET_OF = "du dictionnaire";
Blockly.Msg.DICT_SET_TO = "à";

Blockly.Msg.TEXT_PRINT_TITLE = "afficher la ligne %1";
Blockly.Msg.TEXT_PRINT_TOOLTIP = "Afficher le texte, le nombre ou une autre valeur spécifiée, avec retour à la ligne après.";
Blockly.Msg.TEXT_PRINT_NOEND_TITLE = "afficher %1";
Blockly.Msg.TEXT_PRINT_NOEND_TOOLTIP = "Afficher le texte, le nombre ou une autre valeur spécifiée, sans retour à la ligne.";

Blockly.Msg.TEXT_EVAL_TITLE = "évaluer";
Blockly.Msg.TEXT_EVAL_TOOLTIP = "Évalue l'expression arithmétique spécifiée.";
Blockly.Msg.TEXT_EVAL_INVALID = "Attention : %1 ; ce bloc retournera 'faux' !";

Blockly.Msg.TEXT_STR_TITLE = "convertir en texte %1";
Blockly.Msg.TEXT_STR_TOOLTIP = "Convertir une valeur en texte.";

Blockly.Msg.EVAL_ERROR_SEMICOLON = "le point-virgule ';' n'est pas autorisé";
Blockly.Msg.EVAL_ERROR_SYNTAX = "l'expression n'est pas syntaxiquement valide";
Blockly.Msg.EVAL_ERROR_TYPE = "ce type d'expression (%1) n'est pas autorisé";
Blockly.Msg.EVAL_ERROR_VAR = "cette expression utilise une variable '%1' non définie";

Blockly.Msg.LISTS_APPEND_MSG = "à la liste %1 ajouter l'élément %2";
Blockly.Msg.LISTS_APPEND_TOOLTIP = "Ajouter un élément à la liste '%1'";
Blockly.Msg.LISTS_CREATE_WITH_TOO_LARGE = "Taille de la liste trop grande : %1 > taille maximale autorisée %2"
Blockly.Msg.LISTS_GET_INDEX_FIRST = "au début";
Blockly.Msg.LISTS_GET_INDEX_FROM_END = "à l'indice depuis la fin";
Blockly.Msg.LISTS_GET_INDEX_FROM_START = "à l'indice";
Blockly.Msg.LISTS_GET_INDEX_GET = "obtenir la valeur";
Blockly.Msg.LISTS_GET_INDEX_GET_REMOVE = "obtenir et supprimer la valeur";
Blockly.Msg.LISTS_GET_INDEX_LAST = "à la fin";
Blockly.Msg.LISTS_GET_INDEX_RANDOM = "à un indice aléatoire";
Blockly.Msg.LISTS_GET_INDEX_REMOVE = "supprimer la valeur";
Blockly.Msg.LISTS_SET_INDEX_INSERT = "insérer";
Blockly.Msg.LISTS_SORT_TITLE = "renvoyer le tri %1 %2 de la liste %3"
Blockly.Msg.LISTS_SORT_PLACE_MSG = "trier la liste %1 sur place";
Blockly.Msg.LISTS_SORT_PLACE_TOOLTIP = "Trie la liste '%1' et la modifie directement.";

Blockly.Msg.INPUT_NUM = "lire un nombre seul sur une ligne";
Blockly.Msg.INPUT_NUM_TOOLTIP = "Lit un nombre seul sur une ligne, sur l'entrée du programme.";
Blockly.Msg.INPUT_NUM_LIST = "lire une liste de nombres sur une ligne";
Blockly.Msg.INPUT_NUM_LIST_TOOLTIP = "Lit une liste de nombres sur une ligne, sur l'entrée du programme.";
Blockly.Msg.INPUT_NUM_NEXT = "lire un nombre";
Blockly.Msg.INPUT_NUM_NEXT_TOOLTIP = "Lit le prochain nombre sur l'entrée du programme.";
Blockly.Msg.INPUT_CHAR = "lire un caractère";
Blockly.Msg.INPUT_CHAR_TOOLTIP = "Lit un caractère sur l'entrée du programme.";
Blockly.Msg.INPUT_WORD = "lire un mot";
Blockly.Msg.INPUT_WORD_TOOLTIP = "Lit un mot sur l'entrée du programme.";
Blockly.Msg.INPUT_LINE = "lire une ligne";
Blockly.Msg.INPUT_LINE_TOOLTIP = "Lit une ligne sur l'entrée du programme.";

Blockly.Msg.CANNOT_DELETE_VARIABLE_PROCEDURE = "Impossible de supprimer la variable '%1', utilisée par la procédure '%2'.";

Blockly.Msg.DATA_REPLACEITEMOFLIST_TITLE = "remplacer l'élément %1 de la liste %2 par %3";
Blockly.Msg.DATA_ITEMOFLIST_TITLE = "élément %1 dans %2";
Blockly.Msg.DATA_LISTREPEAT_TITLE = "initialiser la liste %1 avec %2 répété %3 fois";

Blockly.Msg.INVALID_NAME = "Nom invalide, veuillez n'utiliser que des lettres, lettres accentuées françaises, chiffres (sauf comme premier caractère) et tiret bas '_'.";

Blockly.Msg.TABLES_2D_INIT = "initialiser le tableau 2D %1 avec %2 lignes et %3 colonnes contenant %4";
Blockly.Msg.TABLES_2D_INIT_TOOLTIP = "Crée un tableau avec le nombre spécifié de lignes et de colonnes, et initialise chaque case à la valeur donnée.";
Blockly.Msg.TABLES_2D_SET = "dans %1[%2] [%3] mettre %4";
Blockly.Msg.TABLES_3D_SET_TOOLTIP = "Met la valeur dans la case [ligne] [colonne] du tableau %1.";
Blockly.Msg.TABLES_2D_GET = "%1[%2] [%3]";
Blockly.Msg.TABLES_2D_GET_TOOLTIP = "Récupère la valeur dans la case [ligne] [colonne] du tableau %1.";

Blockly.Msg.TABLES_3D_INIT = "initialiser le tableau 3D %1 avec %2 couches, %3 lignes, %4 colonnes contenant %5";
Blockly.Msg.TABLES_3D_INIT_TOOLTIP = "Crée un tableau avec le nombre spécifié de lignes, de colonnes et de niveaux, et initialise chaque case à la valeur donnée.";
Blockly.Msg.TABLES_3D_SET = "dans %1[%2] [%3] [%4] mettre %5";
Blockly.Msg.TABLES_3D_SET_TOOLTIP = "Met la valeur dans la case [couche] [ligne] [colonne] du tableau %1.";
Blockly.Msg.TABLES_3D_GET = "%1[%2] [%3] [%4]";
Blockly.Msg.TABLES_3D_GET_TOOLTIP = "Récupère la valeur dans la case [couche] [ligne] [colonne] du tableau %1.";

Blockly.Msg.TABLES_VAR_NAME = "tableau";
Blockly.Msg.TABLES_TOO_BIG = "Dimensions du tableau trop grandes !";
Blockly.Msg.TABLES_OUT_OF_BOUNDS = "Tentative d'accès à une case hors du tableau !";

Blockly.Msg.VARIABLES_SET = "dans %1 mettre %2";

Blockly.Msg.MATH_DIVISIONFLOOR_SYMBOL = ' // ';
Blockly.Msg.MATH_ARITHMETIC_TOOLTIP_DIVIDEFLOOR = "Renvoie la partie entière de la division des deux nombres.";

export default Blockly;
