namespace Verse;

public enum LookMode : byte
{
	Undefined = 0,
	Value = 1,
	Deep = 2,
	Reference = 3,
	Def = 4,
	LocalTargetInfo = 5,
	TargetInfo = 6,
	GlobalTargetInfo = 7,
	BodyPart = 8
}
