namespace Verse.AI.Group;

public enum PawnLostCondition : byte
{
	Undefined = 0,
	Vanished = 1,
	Incapped = 2,
	Killed = 3,
	MadePrisoner = 4,
	ChangedFaction = 5,
	ExitedMap = 6,
	LeftVoluntarily = 7,
	Drafted = 8,
	ForcedToJoinOtherLord = 9,
	ForcedByPlayerAction = 10,
	ForcedByQuest = 11,
	NoLongerEnteringTransportPods = 12,
	MadeSlave = 13,
	InMentalState = 14,
	LordRejected = 15
}
