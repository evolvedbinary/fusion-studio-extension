export type FSGroupAttributes = {
  email?: string;
  language?: string;
  description?: string;
  [k: string]: string | undefined;
}
export const FS_GROUP_ATTRIBUTE_LABELS: FSGroupAttributes = {
  email:  'email',
  language:  'language',
  description:  'description',
};

export const FS_GROUP_ATTRIBUTES: FSGroupAttributes = {
  email:  'http://axschema.org/contact/email',
  language:  'http://axschema.org/pref/language',
  description:  'http://exist-db.org/security/description',
};

export interface FSGroup {
  groupName: string;
  managers: string[];
  metadata: FSGroupAttributes;
};
export type FSGroupData = FSGroup;

export function sameGroup(user1: FSGroup, user2: FSGroup): boolean {
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

export function writeGroupData(group: FSGroupData): string {
  return JSON.stringify({
    ...group,
    metadata: Object.keys(group.metadata).map(key => ({ key: FS_GROUP_ATTRIBUTES[key], value: group.metadata[key] })),
  });
}

export function readGroup(groupData: any): FSGroup {
  if (typeof groupData === 'string') {
    groupData = JSON.parse(groupData);
  }
  const metadata: FSGroupAttributes = {};
  groupData.metadata.forEach((attribute: any) => {
    Object.keys(FS_GROUP_ATTRIBUTES).find(v => {
      if (FS_GROUP_ATTRIBUTES[v] == attribute.key) {
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
