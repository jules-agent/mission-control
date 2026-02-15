'use client';

import { useState, useCallback } from 'react';

export interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  children: FamilyMember[];
  partner?: FamilyMember;
}

interface FamilyTreeProps {
  identityId: string;
  identityName: string;
  familyTree: FamilyMember | null;
  onSave: (identityId: string, tree: FamilyMember) => void;
}

const RELATIONSHIP_OPTIONS = [
  'Spouse', 'Partner', 'Son', 'Daughter', 'Father', 'Mother',
  'Brother', 'Sister', 'Grandfather', 'Grandmother',
  'Grandson', 'Granddaughter', 'Uncle', 'Aunt',
  'Nephew', 'Niece', 'Cousin', 'Stepson', 'Stepdaughter',
  'Stepfather', 'Stepmother', 'Father-in-law', 'Mother-in-law',
  'Son-in-law', 'Daughter-in-law', 'Brother-in-law', 'Sister-in-law',
];

function generateId() {
  return crypto.randomUUID();
}

function createDefaultTree(name: string): FamilyMember {
  return {
    id: generateId(),
    name,
    relationship: 'Self',
    children: [],
  };
}

// Add a member to a specific node in the tree (immutable update)
function addMemberToTree(
  tree: FamilyMember,
  parentId: string,
  newMember: FamilyMember,
  asPartner: boolean
): FamilyMember {
  if (tree.id === parentId) {
    if (asPartner) {
      return { ...tree, partner: newMember };
    }
    return { ...tree, children: [...tree.children, newMember] };
  }
  // Check partner
  let updatedPartner = tree.partner;
  if (tree.partner) {
    if (tree.partner.id === parentId) {
      if (asPartner) {
        updatedPartner = { ...tree.partner, partner: newMember };
      } else {
        updatedPartner = { ...tree.partner, children: [...tree.partner.children, newMember] };
      }
      return { ...tree, partner: updatedPartner };
    }
  }
  // Recurse children
  const updatedChildren = tree.children.map(child =>
    addMemberToTree(child, parentId, newMember, asPartner)
  );
  return { ...tree, children: updatedChildren, partner: updatedPartner };
}

// Remove a member from the tree
function removeMemberFromTree(tree: FamilyMember, memberId: string): FamilyMember {
  // Remove from partner
  let updatedPartner = tree.partner;
  if (tree.partner?.id === memberId) {
    updatedPartner = undefined;
  }
  // Remove from children
  const updatedChildren = tree.children
    .filter(c => c.id !== memberId)
    .map(c => removeMemberFromTree(c, memberId));
  return { ...tree, children: updatedChildren, partner: updatedPartner };
}

// Rename a member
function renameMemberInTree(tree: FamilyMember, memberId: string, newName: string): FamilyMember {
  if (tree.id === memberId) return { ...tree, name: newName };
  const updatedPartner = tree.partner
    ? tree.partner.id === memberId
      ? { ...tree.partner, name: newName }
      : renameMemberInTree(tree.partner, memberId, newName)
    : undefined;
  const updatedChildren = tree.children.map(c => renameMemberInTree(c, memberId, newName));
  return { ...tree, children: updatedChildren, partner: updatedPartner };
}

function MemberNode({
  member,
  depth,
  isPartner,
  onAddChild,
  onAddPartner,
  onRemove,
  onRename,
}: {
  member: FamilyMember;
  depth: number;
  isPartner?: boolean;
  onAddChild: (parentId: string) => void;
  onAddPartner: (parentId: string) => void;
  onRemove: (memberId: string) => void;
  onRename: (memberId: string) => void;
}) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasFamily = member.children.length > 0 || !!member.partner;
  const isSelf = member.relationship === 'Self';

  return (
    <div className={depth > 0 ? 'ml-6 relative' : ''}>
      {/* Connector line */}
      {depth > 0 && (
        <div className="absolute left-[-16px] top-0 bottom-0 w-px bg-zinc-700/50" />
      )}
      {depth > 0 && (
        <div className="absolute left-[-16px] top-[22px] w-4 h-px bg-zinc-700/50" />
      )}

      {/* Member card */}
      <div className={`flex items-center gap-2 py-1.5 ${isPartner ? 'ml-0' : ''}`}>
        {/* Expand/collapse */}
        {hasFamily ? (
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-6 h-6 flex items-center justify-center rounded-md bg-zinc-800/60 text-zinc-500 text-[12px] flex-shrink-0 active:opacity-60"
          >
            {expanded ? '▾' : '▸'}
          </button>
        ) : (
          <div className="w-6" />
        )}

        {/* Avatar */}
        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[14px] font-semibold flex-shrink-0 ${
          isSelf
            ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white'
            : isPartner
              ? 'bg-gradient-to-br from-pink-500 to-rose-600 text-white'
              : 'bg-zinc-700 text-zinc-300'
        }`}>
          {member.name?.[0]?.toUpperCase() || '?'}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-medium text-white truncate">{member.name}</p>
          <p className="text-[12px] text-zinc-500">{member.relationship}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {!member.partner && (
            <button
              onClick={() => onAddPartner(member.id)}
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-pink-500/10 text-pink-400 text-[12px] active:opacity-60"
              title="Add partner"
            >
              💍
            </button>
          )}
          <button
            onClick={() => onAddChild(member.id)}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 text-[14px] active:opacity-60"
            title="Add family member"
          >
            +
          </button>
          {!isSelf && (
            <>
              <button
                onClick={() => onRename(member.id)}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-zinc-800 text-zinc-500 text-[12px] active:opacity-60"
                title="Rename"
              >
                ✏️
              </button>
              <button
                onClick={() => onRemove(member.id)}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-500/10 text-red-400 text-[12px] active:opacity-60"
                title="Remove"
              >
                ✕
              </button>
            </>
          )}
        </div>
      </div>

      {/* Partner */}
      {expanded && member.partner && (
        <MemberNode
          member={member.partner}
          depth={depth}
          isPartner
          onAddChild={onAddChild}
          onAddPartner={onAddPartner}
          onRemove={onRemove}
          onRename={onRename}
        />
      )}

      {/* Children */}
      {expanded && member.children.length > 0 && (
        <div className="mt-1">
          {member.children.map(child => (
            <MemberNode
              key={child.id}
              member={child}
              depth={depth + 1}
              onAddChild={onAddChild}
              onAddPartner={onAddPartner}
              onRemove={onRemove}
              onRename={onRename}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FamilyTree({ identityId, identityName, familyTree, onSave }: FamilyTreeProps) {
  const [tree, setTree] = useState<FamilyMember>(() =>
    familyTree || createDefaultTree(identityName)
  );
  const [showAddModal, setShowAddModal] = useState<{ parentId: string; asPartner: boolean } | null>(null);
  const [addName, setAddName] = useState('');
  const [addRelationship, setAddRelationship] = useState('');
  const [expanded, setExpanded] = useState(true);

  const saveTree = useCallback((updatedTree: FamilyMember) => {
    setTree(updatedTree);
    onSave(identityId, updatedTree);
  }, [identityId, onSave]);

  function handleAddMember() {
    if (!showAddModal || !addName.trim() || !addRelationship) return;
    const newMember: FamilyMember = {
      id: generateId(),
      name: addName.trim(),
      relationship: addRelationship,
      children: [],
    };
    const updated = addMemberToTree(tree, showAddModal.parentId, newMember, showAddModal.asPartner);
    saveTree(updated);
    setShowAddModal(null);
    setAddName('');
    setAddRelationship('');
  }

  function handleRemove(memberId: string) {
    if (!confirm('Remove this family member?')) return;
    const updated = removeMemberFromTree(tree, memberId);
    saveTree(updated);
  }

  function handleRename(memberId: string) {
    const newName = prompt('New name:');
    if (!newName?.trim()) return;
    const updated = renameMemberInTree(tree, memberId, newName.trim());
    saveTree(updated);
  }

  // Count total members
  function countMembers(m: FamilyMember): number {
    let count = 1;
    if (m.partner) count += countMembers(m.partner);
    m.children.forEach(c => { count += countMembers(c); });
    return count;
  }
  const total = countMembers(tree);

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between mb-3"
      >
        <label className="text-[13px] text-zinc-500 uppercase tracking-wider font-medium">
          👨‍👩‍👧‍👦 Family ({total} {total === 1 ? 'member' : 'members'})
        </label>
        <span className="text-zinc-600 text-[12px]">{expanded ? '▾' : '▸'}</span>
      </button>

      {expanded && (
        <div className="bg-zinc-800/40 rounded-xl p-3 border border-zinc-800/60">
          <MemberNode
            member={tree}
            depth={0}
            onAddChild={(parentId) => {
              setShowAddModal({ parentId, asPartner: false });
              setAddName('');
              setAddRelationship('');
            }}
            onAddPartner={(parentId) => {
              setShowAddModal({ parentId, asPartner: true });
              setAddName('');
              setAddRelationship('Spouse');
            }}
            onRemove={handleRemove}
            onRename={handleRename}
          />
        </div>
      )}

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 z-[10000] flex items-end sm:items-center justify-center" onClick={() => setShowAddModal(null)}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-t-2xl sm:rounded-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-zinc-800/60">
              <h3 className="text-[17px] font-semibold text-white">
                {showAddModal.asPartner ? 'Add Partner' : 'Add Family Member'}
              </h3>
            </div>
            <div className="px-5 py-4 space-y-4">
              <div>
                <label className="block text-[13px] text-zinc-500 mb-1.5">Name</label>
                <input
                  type="text"
                  value={addName}
                  onChange={e => setAddName(e.target.value)}
                  placeholder="Full name"
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-[15px] text-white placeholder-zinc-600 focus:outline-none focus:border-[#007AFF]"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-[13px] text-zinc-500 mb-1.5">Relationship</label>
                <div className="grid grid-cols-3 gap-2 max-h-[200px] overflow-y-auto">
                  {(showAddModal.asPartner
                    ? ['Spouse', 'Partner', 'Fiancé', 'Fiancée']
                    : RELATIONSHIP_OPTIONS
                  ).map(rel => (
                    <button
                      key={rel}
                      onClick={() => setAddRelationship(rel)}
                      className={`px-3 py-2 rounded-lg text-[13px] font-medium transition-all border ${
                        addRelationship === rel
                          ? 'bg-[#007AFF] border-[#007AFF] text-white'
                          : 'bg-zinc-800 border-zinc-700 text-zinc-400 active:bg-zinc-700'
                      }`}
                    >
                      {rel}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowAddModal(null)}
                  className="flex-1 py-3 rounded-xl text-[15px] font-semibold bg-zinc-800 border border-zinc-700 text-zinc-300 active:opacity-80"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddMember}
                  disabled={!addName.trim() || !addRelationship}
                  className={`flex-1 py-3 rounded-xl text-[15px] font-semibold transition-all ${
                    addName.trim() && addRelationship
                      ? 'bg-[#007AFF] active:bg-[#0064CC] text-white'
                      : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                  }`}
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
