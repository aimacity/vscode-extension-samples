'use strict';

import * as vscode from 'vscode';

let threadId = 0;
let commentId = 0;

export function activate(context: vscode.ExtensionContext) {
	// A `CommentController` is able to provide comments for documents.
	const commentController = vscode.comment.createCommentController('comment-sample', 'Comment API Sample');
	context.subscriptions.push(commentController);

	// commenting range provider
	commentController.commentingRangeProvider = {
		provideCommentingRanges: (document: vscode.TextDocument, token: vscode.CancellationToken) => {
			let lineCount = document.lineCount;
			return [new vscode.Range(0, 0, lineCount - 1, 0)];
		}
	};
	
	commentController.template = {
		label: 'Create New Note:',
		acceptInputCommand: {
			title: 'Create Note',
			command: 'mywiki.createNote',
			// Command is responsible for arguments
			arguments: [
				commentController
			]
		}
	};

	// register `mywiki.createNote` command
	context.subscriptions.push(vscode.commands.registerCommand('mywiki.createNote', (commentController: vscode.CommentController, thread: vscode.CommentThread | undefined) => {
		if (commentController.inputBox) {
			if (!thread) {
				// the comment thread is created from comment thread template
				let thread = commentController.createCommentThread(`${++threadId}`, commentController.inputBox.resource, commentController.inputBox.range, []);
					// by default, a comment thread is collapsed, for newly created empty comment thread, we want to expand it and users can start commenting immediately
				thread.collapsibleState = vscode.CommentThreadCollapsibleState.Expanded;

				// In this example, we call it `Create New Note` while for GH PR case, we can call it `Start Review` or `Start New Converstation`
				let text = commentController.inputBox.value;
				let markedString = new vscode.MarkdownString(text);
				let newComment = new vscode.Comment(`${++commentId}`, markedString, 'vscode');
				
				thread.comments = [newComment];
				thread.label = 'Participants: vscode';
				
				// We will render all `acceptInputCommands` as Actions on the bottom of Comment Widget in the editor.
				thread.acceptInputCommand = {
					title: 'Create Comment',
					command: 'mywiki.createComment',
					arguments: [
						commentController,
						thread
					]
				};
				
				thread.deleteCommand = {
					title: 'Delete Note',
					command: 'mywiki.deleteNote',
					arguments: [
						thread
					]
				};
				
				// Lastly, we want to clear the textarea in Comment Widget.
				commentController.inputBox.value = '';
			} else {
				// Read text from the focused textarea in the Comment Widget.
				let text = commentController.inputBox.value;
				let markedString = new vscode.MarkdownString(text);
				let newComment = new vscode.Comment(`${++commentId}`, markedString, 'vscode');
	
				thread.comments = [newComment];
				thread.label = 'Participants: vscode';
	
				// After we create the new comment thread, we may want to update the actions on the Comment Widget.
				thread.acceptInputCommand = {
					title: 'Create Comment',
					command: 'mywiki.createComment',
					arguments: [
						commentController,
						thread
					]
				};
	
				// Lastly, we want to clear the textarea in Comment Widget.
				commentController.inputBox.value = '';
			}
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand('mywiki.createComment', (commentController: vscode.CommentController, thread: vscode.CommentThread) => {
		if (commentController.inputBox) {
			let text = commentController.inputBox.value;
			let markedString = new vscode.MarkdownString(text);
			let newComment = new vscode.Comment(`${++commentId}`, markedString, 'vscode');

			thread.comments = [...thread.comments, newComment];
			commentController.inputBox.value = '';
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand('mywiki.deleteNote', (thread: vscode.CommentThread) => {
		thread.dispose();
	}));
}
