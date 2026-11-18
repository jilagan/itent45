"""One-time: split src/<page>/app.js at section markers into src/<page>/js/."""
import re,json,pathlib
root=pathlib.Path(__file__).resolve().parent.parent
ids={"index":"shell layers journey bytes basics tiers rest clients render pay mem server scale enlist split vm cost region txn sql rea card entity norm query shape break".split(),
     "machine":"shell intro next learn train deep backprop tokens embed vectors rnn attn ctx prompt loop tools math vibe".split()}
for page,names in ids.items():
    d=root/"src"/page; L=(d/"app.js").read_text(encoding="utf-8").split("\n")
    cuts=[0]+[i for i,x in enumerate(L) if re.match(r"/\* =+",x) and i>0 and not (page=="index" and "shell" in x)]
    assert len(cuts)==len(names),(page,len(cuts),len(names))
    (d/"js").mkdir(exist_ok=True); order=[]
    for k,a in enumerate(cuts):
        b=cuts[k+1] if k+1<len(cuts) else len(L)
        fn=f"{k:02d}-{names[k]}.js"; order.append(fn)
        txt="\n".join(L[a:b]); 
        if k+1<len(cuts): txt+="\n"
        (d/"js"/fn).write_text(txt,encoding="utf-8")
    (d/"js-order.json").write_text(json.dumps(order,indent=1)+"\n")
    (d/"app.js").unlink()
