"""Username rules against the live profile service: case and spacing collapse to one key, two simultaneous creates
of the same name yield exactly one profile, and bad names are refused by the database itself."""
import sys
import threading
import uuid
from testlib import rest, test_name, key_of, cleanup

results = []
def check(name, ok, detail=""):
    results.append(ok); print(("PASS " if ok else "FAIL ") + name + (" — " + str(detail) if detail else ""))

def row(username, key=None):
    return {"id": str(uuid.uuid4()), "username": username, "username_key": key if key is not None else key_of(username), "total_xp": 0, "level": 1, "coins": 0, "cosmetics": {}, "settings": {}}

base = test_name("name")
# 1. create once
code, body = rest("/profiles", "POST", row(base))
check("first create succeeds", code == 201, (code, body))
# 2. same letters, different case and extra spaces -> taken
variant = " ".join(("  " + base.upper().replace(" ", "   ") + " ").split())  # the client collapses spaces before sending; case stays
code2, body2 = rest("/profiles", "POST", row(variant))
check("case and spacing variant is refused (409 / 23505)", code2 == 409 or (isinstance(body2, dict) and body2.get("code") == "23505"), (code2, body2))
# 3. two simultaneous creates of a new name -> exactly one wins
race = test_name("race"); codes = []
def go():
    c, _ = rest("/profiles", "POST", row(race)); codes.append(c)
ts = [threading.Thread(target=go) for _ in range(2)]
[t.start() for t in ts]; [t.join() for t in ts]
code3, rows3 = rest(f"/profiles?username_key=eq.{key_of(race).replace(' ', '%20')}&select=id")
check("two simultaneous creates: one 201, one 409, one row", sorted(codes) == [201, 409] and code3 == 200 and len(rows3) == 1, (codes, rows3))
# 4. the database refuses names the client would also refuse
code4, body4 = rest("/profiles", "POST", row("zz"))
code5, body5 = rest("/profiles", "POST", row("zztest bad!name"))
code6, body6 = rest("/profiles", "POST", row("zztest mismatch", key="zztest other key"))
check("too short refused", code4 >= 400, code4)
check("bad characters refused", code5 >= 400, code5)
check("key must match the normalized name", code6 >= 400, code6)
# 5. lookup by key finds the original casing
code7, rows7 = rest(f"/profiles?username_key=eq.{key_of(base).replace(' ', '%20')}&select=username")
check("lookup by key returns the stored name", code7 == 200 and rows7 and rows7[0]["username"] == base, rows7)
print("cleanup:", cleanup(base, race))
print(f"\n{sum(results)}/{len(results)} checks passed")
sys.exit(0 if all(results) else 1)
