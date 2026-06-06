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

export function IntegrationSettingsPanel({ group, linkedSuccess, actionError }) {
  const submit = useSubmit();
  const navigation = useNavigation();
  const [, setSearchParams] = useSearchParams();
  const [targetShop, setTargetShop] = useState("");
  const [showLinkedBanner, setShowLinkedBanner] = useState(false);
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

  const handleLinkStore = () => {
    if (!targetShop || isSubmitting) return;
    submit({ targetShop }, { method: "post" });
  };

  return (
    <Stack>
      {showLinkedBanner ? (
        <Banner tone="success" icon={<CheckCircle2 size={18} />}>
          Store linked successfully.
        </Banner>
      ) : null}

      {actionError ? (
        <Banner tone="critical" icon={<AlertCircle size={18} />}>
          {actionError}
        </Banner>
      ) : null}

      <Card
        title="Connect another store"
        description="Enter a .myshopify.com domain. That store must have this app installed."
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
              />
            ))}
          </Stack>
        )}
      </Card>
    </Stack>
  );
}
