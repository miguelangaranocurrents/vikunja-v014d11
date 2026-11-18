import type {Fragment, Node as ProseMirrorNode, Slice} from '@tiptap/pm/model'

// Plain text for copied editor content. ProseMirror's default drops the list markers
// and only separates blocks, so a copied bullet list would paste back as bare lines.
export function serializeSliceAsText(slice: Slice): string {
	return blockLines(slice.content).join('\n')
}

function blockLines(fragment: Fragment): string[] {
	const lines: string[] = []
	fragment.forEach(node => {
		lines.push(...nodeLines(node))
	})
	return lines
}

function nodeLines(node: ProseMirrorNode): string[] {
	switch (node.type.name) {
		case 'bulletList':
		case 'taskList':
			return listLines(node, () => '- ')
		case 'orderedList': {
			let index = Number(node.attrs.start ?? 1)
			return listLines(node, () => `${index++}. `)
		}
		case 'blockquote':
			return blockLines(node.content).map(line => line === '' ? '>' : `> ${line}`)
		default:
			if (node.isTextblock) {
				return [node.textContent]
			}
			if (node.isLeaf) {
				return []
			}
			return blockLines(node.content)
	}
}

function listLines(list: ProseMirrorNode, marker: () => string): string[] {
	const lines: string[] = []
	list.forEach(item => {
		const prefix = marker()
		const itemLines = blockLines(item.content)
		if (itemLines.length === 0) {
			lines.push(prefix.trimEnd())
			return
		}
		const indent = ' '.repeat(prefix.length)
		itemLines.forEach((line, i) => {
			lines.push(i === 0 ? prefix + line : indent + line)
		})
	})
	return lines
}
