export type PebbleGroupAttributes = {
  email?: string;
  language?: string;
  description?: string;
  [k: string]: string | undefined;
}
export const PEBBLE_GROUP_ATTRIBUTE_LABELS: PebbleGroupAttributes = {
  email:  'email',
  language:  'language',
  description:  'description',
};

export const PEBBLE_GROUP_ATTRIBUTES: PebbleGroupAttributes = {
  email:  'http://axschema.org/contact/email',
  language:  'http://axschema.org/pref/language',
  description:  'http://exist-db.org/security/description',
};

export interface PebbleGroup {
  groupName: string;
  managers: string[];
  metadata: PebbleGroupAttributes;
};
export type PebbleGroupData = PebbleGroup;

export function sameGroup(user1: PebbleGroup, user2: PebbleGroup): boolean {
  if (user1.managers.length !== user2.managers.length) {
    return false
  }
  if (user1.managers.find(manager => user2.managers.indexOf(manager) < 0)) {
    return false
  }
  if (Object.keys(user1.metadata).length !== Object.keys(user2.metadata).length) {
    return false
  }
  if (Object.keys(user1.metadata).find(key => user2.metadata[key] != user1.metadata[key])) {
    return false
  }
  return true;
}

export function writeGroupData(group: PebbleGroupData): string {
  return JSON.stringify({
    ...group,
    metadata: Object.keys(group.metadata).map(key => ({ key: PEBBLE_GROUP_ATTRIBUTES[key], value: group.metadata[key] })),
  });
}

export function readGroup(groupData: any): PebbleGroup {
  if (typeof groupData === 'string') {
    groupData = JSON.parse(groupData);
  }
  const metadata: PebbleGroupAttributes = {};
  groupData.metadata.forEach((attribute: any) => {
    Object.keys(PEBBLE_GROUP_ATTRIBUTES).find(v => {
      if (PEBBLE_GROUP_ATTRIBUTES[v] == attribute.key) {
        metadata[v] = attribute.value || '';
        return true;
      }
      return false;
    });
  });
  return {
    ...groupData,
    metadata,
  };
}
