namespace Verse;

public enum DestroyMode : byte
{
	Vanish = 0,
	WillReplace = 1,
	KillFinalize = 2,
	KillFinalizeLeavingsOnly = 3,
	Deconstruct = 4,
	FailConstruction = 5,
	Cancel = 6,
	Refund = 7,
	QuestLogic = 8
}
