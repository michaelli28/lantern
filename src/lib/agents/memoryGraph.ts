import Anthropic from "@anthropic-ai/sdk";
import type { Entity, Fragment, StreamEvent } from "@/lib/types";
import {
  LINK_ENTITIES_TOOL,
  MEMORY_GRAPH_SYSTEM,
  UPSERT_ENTITY_TOOL,
} from "@/lib/prompts";
import { consumeStream } from "./streamHelper";

export async function runMemoryGraph(
  fragments: Fragment[],
  emit: (e: StreamEvent) => void,
): Promise<Entity[]> {
  const client = new Anthropic();
  const entitiesById = new Map<string, Entity>();

  const stream = client.messages.stream({
    model: "claude-haiku-4-5",
    max_tokens: 2048,
    system: MEMORY_GRAPH_SYSTEM,
    tools: [UPSERT_ENTITY_TOOL, LINK_ENTITIES_TOOL],
    messages: [
      {
        role: "user",
        content: `Fragments:\n\n${JSON.stringify(fragments, null, 2)}`,
      },
    ],
  });

  await consumeStream(stream, {
    onToolCall: (name, input) => {
      if (name === "upsert_entity") {
        const i = input as {
          id?: string;
          kind?: string;
          name?: string;
          description?: string;
        };
        if (!i.id || !i.kind || !i.name) return;
        const ent: Entity = {
          id: i.id,
          kind: i.kind as Entity["kind"],
          name: i.name,
          description: i.description,
        };
        entitiesById.set(ent.id, ent);
        emit({ type: "entity", entity: ent });
      } else if (name === "link_entities") {
        const i = input as { from?: string; to?: string; relation?: string };
        if (!i.from || !i.to) return;
        const ent = entitiesById.get(i.from);
        if (ent) {
          ent.relatedTo = ent.relatedTo ?? [];
          if (!ent.relatedTo.includes(i.to)) ent.relatedTo.push(i.to);
        }
      }
    },
  });

  return Array.from(entitiesById.values());
}
