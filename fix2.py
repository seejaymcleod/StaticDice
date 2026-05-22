with open('DiceRoller.html', 'r') as f:
    html = f.read()

s = html.find('function renderEvalCriteria()')
e = html.find('function toggleEvalGate(idx)')

if s != -1 and e != -1:
    block = html[s:e]
    
    # Just do literal replacements for exactly what's there
    block = block.replace("updateEvalCriteria(' + i + ','numVal',this.value)", "updateEvalCriteria(' + i + ', &quot;numVal&quot;, this.value)")
    block = block.replace("updateEvalCriteria(' + i + ','varVal',this.value)", "updateEvalCriteria(' + i + ', &quot;varVal&quot;, this.value)")
    block = block.replace("updateEvalCriteria(' + i + ','op',this.value)", "updateEvalCriteria(' + i + ', &quot;op&quot;, this.value)")
    block = block.replace("setEvalCriteriaMode(' + i + ','NUM')", "setEvalCriteriaMode(' + i + ', &quot;NUM&quot;)")
    block = block.replace("setEvalCriteriaMode(' + i + ','VAR')", "setEvalCriteriaMode(' + i + ', &quot;VAR&quot;)")
    
    html = html[:s] + block + html[e:]
    
    with open('DiceRoller.html', 'w') as f:
        f.write(html)
    print("Fixed strings in DiceRoller.html")
else:
    print("Could not find block")
