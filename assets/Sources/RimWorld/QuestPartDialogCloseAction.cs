using System;
using Verse;

namespace RimWorld;

public class QuestPartDialogCloseAction
{
	public enum CloseActionKey
	{
		None = 0,
		ArchonexusVictorySound2nd = 1,
		ArchonexusVictorySound3rd = 2
	}

	public SoundDef dialogCloseSound;

	public Action dialogCloseAction;
}
