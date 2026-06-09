/* eslint-disable react-hooks/set-state-in-effect, react/prop-types */
import { useEffect, useState } from "react";
import { useSubmit, useNavigation, useSearchParams } from "react-router";
import { CheckCircle2, AlertCircle, Store, Crown } from "lucide-react";
import {
  Badge,
  Banner,
  Card,
  EmptyState,
  PrimaryButton,
  ResourceRow,
  Stack,
  TextField,
} from "../admin-ui";

export function IntegrationSettingsPanel({ group, linkedSuccess, unlinkedSuccess, actionError }) {
  const submit = useSubmit();
  const navigation = useNavigation();
  const [, setSearchParams] = useSearchParams();
  const [targetShop, setTargetShop] = useState("");
  const [showLinkedBanner, setShowLinkedBanner] = useState(false);
  const [showUnlinkedBanner, setShowUnlinkedBanner] = useState(false);
  const isSubmitting = navigation.state === "submitting";

  useEffect(() => {
    if (!linkedSuccess) return;
    setShowLinkedBanner(true);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("linked");
        return next;
      },
      { replace: true },
    );
  }, [linkedSuccess, setSearchParams]);

  useEffect(() => {
    if (!unlinkedSuccess) return;
    setShowUnlinkedBanner(true);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("unlinked");
        return next;
      },
      { replace: true },
    );
  }, [unlinkedSuccess, setSearchParams]);

  const handleLinkStore = () => {
    if (!targetShop || isSubmitting) return;
    submit({ targetShop, intent: "linkStore" }, { method: "post" });
  };

  const handleUnlink = (shopDomain, isDismantle, isLeave) => {
    let confirmMsg = `Are you sure you want to unlink ${shopDomain}?`;
    if (isDismantle) {
      confirmMsg = "Are you sure you want to dismantle this store network? This will disconnect all linked stores from each other.";
    } else if (isLeave) {
      confirmMsg = "Are you sure you want to leave this store network? You will no longer share reviews or products.";
    }

    if (window.confirm(confirmMsg)) {
      submit(
        { targetShop: shopDomain, intent: "unlinkStore" },
        { method: "post" }
      );
    }
  };

  const currentMember = group?.members?.find((m) => m.isCurrent);
  const currentRole = currentMember?.role || "MEMBER";

  const unlinkButtonStyle = {
    background: "none",
    border: "none",
    color: "#d72c0d",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "700",
    padding: "4px 8px",
    borderRadius: "4px",
    fontFamily: "inherit",
    transition: "background 0.15s ease, opacity 0.15s ease",
  };

  const renderActions = (member) => {
    const isPrimary = currentRole === "PRIMARY";
    
    if (member.isCurrent) {
      if (isPrimary) {
        return (
          <button
            onClick={() => handleUnlink(member.shop, true, false)}
            disabled={isSubmitting}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#fff4f4";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "none";
            }}
            style={{ ...unlinkButtonStyle, opacity: isSubmitting ? 0.6 : 1 }}
          >
            Dismantle network
          </button>
        );
      } else {
        return (
          <button
            onClick={() => handleUnlink(member.shop, false, true)}
            disabled={isSubmitting}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#fff4f4";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "none";
            }}
            style={{ ...unlinkButtonStyle, opacity: isSubmitting ? 0.6 : 1 }}
          >
            Leave network
          </button>
        );
      }
    } else {
      if (isPrimary) {
        return (
          <button
            onClick={() => handleUnlink(member.shop, false, false)}
            disabled={isSubmitting}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#fff4f4";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "none";
            }}
            style={{ ...unlinkButtonStyle, opacity: isSubmitting ? 0.6 : 1 }}
          >
            Unlink
          </button>
        );
      }
    }
    return null;
  };

  return (
    <Stack>
      {showLinkedBanner ? (
        <Banner tone="success" icon={<CheckCircle2 size={18} />}>
          Store linked successfully.
        </Banner>
      ) : null}

      {showUnlinkedBanner ? (
        <Banner tone="success" icon={<CheckCircle2 size={18} />}>
          Store unlinked successfully.
        </Banner>
      ) : null}

      {actionError ? (
        <Banner tone="critical" icon={<AlertCircle size={18} />}>
          {actionError}
        </Banner>
      ) : null}

      <Card
        title="Connect another store"
        description="Enter a .myshopify.com or custom domain. That store must have this app installed."
      >
        <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <TextField
              value={targetShop}
              onChange={(e) => setTargetShop(e.target.value)}
              placeholder="brand-uk.myshopify.com"
              disabled={isSubmitting}
            />
          </div>
          <PrimaryButton
            onClick={handleLinkStore}
            disabled={isSubmitting || !targetShop.trim()}
            loading={isSubmitting}
          >
            Connect store
          </PrimaryButton>
        </div>
      </Card>

      <Card title="Store network">
        {!group ? (
          <EmptyState
            icon={<Store size={32} color="#8c9196" />}
            title="No linked stores yet"
            description="Connect another store above to share reviews across your network."
          />
        ) : (
          <Stack>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#6d7175" }}>
              {group.members.length} store{group.members.length === 1 ? "" : "s"} in this network.
            </p>
            {group.members.map((member) => (
              <ResourceRow
                key={member.id}
                title={member.shop}
                icon={<Store size={16} color="#6d7175" />}
                badges={
                  <>
                    {member.role === "PRIMARY" ? (
                      <Badge tone="warning">
                        <Crown size={11} /> Primary
                      </Badge>
                    ) : null}
                    {member.isCurrent ? (
                      <Badge tone="green">This store</Badge>
                    ) : (
                      <Badge tone="blue">Linked</Badge>
                    )}
                  </>
                }
                actions={renderActions(member)}
              />
            ))}
          </Stack>
        )}
      </Card>
    </Stack>
  );
}
