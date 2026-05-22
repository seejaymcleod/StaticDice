import re

with open('DiceRoller.html', 'r') as f:
    html = f.read()

s = html.find('function renderEvalCriteria()')
e = html.find('function toggleEvalGate(idx)')

if s != -1 and e != -1:
    block = html[s:e]
    
    # We want to replace all occurrences inside the HTML string literal:
    # onchange="updateEvalCriteria(' + i + ',\'numVal\',this.value)"
    # We will use `&quot;numVal&quot;` to be completely safe against JS string literal parsing inside HTML.
    
    import re
    # Strip away all the broken escapes first
    block = re.sub(r"updateEvalCriteria\(' \+ i \+ ',\s*\\\\?\'numVal\\\\?',this.value\)", "updateEvalCriteria(' + i + ', &quot;numVal&quot;, this.value)", block)
    block = re.sub(r"updateEvalCriteria\(' \+ i \+ ',\s*\\\\?\'varVal\\\\?',this.value\)", "updateEvalCriteria(' + i + ', &quot;varVal&quot;, this.value)", block)
    block = re.sub(r"updateEvalCriteria\(' \+ i \+ ',\s*\\\\?\'op\\\\?',this.value\)", "updateEvalCriteria(' + i + ', &quot;op&quot;, this.value)", block)
    block = re.sub(r"setEvalCriteriaMode\(' \+ i \+ ',\s*\\\\?\'NUM\\\\?'\)", "setEvalCriteriaMode(' + i + ', &quot;NUM&quot;)", block)
    block = re.sub(r"setEvalCriteriaMode\(' \+ i \+ ',\s*\\\\?\'VAR\\\\?'\)", "setEvalCriteriaMode(' + i + ', &quot;VAR&quot;)", block)
    
    html = html[:s] + block + html[e:]
    
    with open('DiceRoller.html', 'w') as f:
        f.write(html)
    print("Fixed strings in DiceRoller.html")
else:
    print("Could not find block")
