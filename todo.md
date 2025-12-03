## `get_def_details`

输入一个 defName (例如 Bullet_SniperRifle)，该工具能以结构化的形式返回这个 Def 的所有属性，包括它从父级 ParentName 继承来的属性。

可能需要考虑在未来增加一个 paths 或 keys 参数来让 LLM 只请求它关心的字段（比如只看 `<statBases>`）。

## `find_linked_defs`

输入一个 defName，找到所有在 XML 中引用了这个 defName 的其他 Def。

找到了 Bullet_SniperRifle 的定义，但哪个武器在使用它呢？我必须反过来去搜索 Bullet_SniperRifle 这个字符串。如果有了 find_linked_defs，我就可以直接问：“哪个 ThingDef 的 projectile 指向了 Bullet_SniperRifle？”，它会直接告诉我答案是 Gun_SniperRifle。这能极大地加速我理解物品之间关联的速度。

```
<.*>YourTargetDefName</.*>
```
